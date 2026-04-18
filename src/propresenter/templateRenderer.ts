import type { SlideInput } from "../inputSchema.js";
import { encodeMessage, encodeMessageField, encodeString, encodeVarintField, type WireValue } from "../protobuf/wire.js";
import {
  cloneNode,
  decodeTree,
  encodeTree,
  findStringNodeAtPath,
  getString,
  nodeToWire,
  setString,
  walkNodes,
  type WireNode
} from "../protobuf/tree.js";
import { buildCue, buildCueOrder } from "./buildCue.js";
import { Fields } from "./fields.js";
import type { PresentationModel, SlideModel, TextElementModel } from "./model.js";
import { createId, createNumericBuildId } from "./ids.js";

export type TemplateRenderResult = {
  bytes: Uint8Array;
  warnings: string[];
  themedSlideCount: number;
};

type TextElementRef = {
  label: string;
  labelNode: WireNode;
  rtfNode: WireNode;
};

type TemplateCue = {
  label: string;
  node: WireNode;
  textElements: TextElementRef[];
};

const UUID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function buildPresentationWithTemplate(
  model: PresentationModel,
  inputSlides: SlideInput[],
  templateBytes: Uint8Array
): TemplateRenderResult {
  const root = decodeTree(templateBytes);
  const templateCues = discoverTemplateCues(root);
  const warnings: string[] = [];
  let themedSlideCount = 0;

  const cueFields = model.slides.map((slide, index) => {
    const theme = inputSlides[index]?.theme?.trim();
    if (!theme) {
      return buildCue(slide);
    }

    const templateCue = templateCues.get(theme);
    if (!templateCue) {
      throw new Error(`slides[${index}].theme "${theme}" did not match any template slide label`);
    }

    themedSlideCount += 1;
    warnings.push(`slides[${index}] used template theme "${theme}"`);
    return renderTemplateCue(templateCue, slide, index, warnings);
  });

  return {
    bytes: encodeTree(buildTemplateRoot(root, model, cueFields)),
    warnings,
    themedSlideCount
  };
}

function discoverTemplateCues(root: WireNode[]): Map<string, TemplateCue> {
  const cues = new Map<string, TemplateCue>();

  for (const node of root) {
    if (node.field !== Fields.presentation.cue || node.type !== "length" || !node.children) {
      continue;
    }

    const labelNode = findStringNodeAtPath(node.children, [Fields.cue.body, Fields.cueBody.label, 2]);
    const label = labelNode ? getString(labelNode) : null;
    if (!label) {
      continue;
    }

    cues.set(label, {
      label,
      node,
      textElements: findTextElements(node.children)
    });
  }

  return cues;
}

function renderTemplateCue(templateCue: TemplateCue, slide: SlideModel, slideIndex: number, warnings: string[]): WireValue {
  const cueNode = cloneNode(templateCue.node);
  if (cueNode.type !== "length" || !cueNode.children) {
    throw new Error(`Template cue "${templateCue.label}" could not be decoded for editing`);
  }

  replaceUuidStrings(cueNode.children);
  setRequiredString(cueNode.children, [Fields.cue.id, 1], slide.cueId, `slides[${slideIndex}] cue id`);
  setRequiredString(cueNode.children, [Fields.cue.body, Fields.cueBody.id, 1], slide.id, `slides[${slideIndex}] slide id`);
  setRequiredString(cueNode.children, [Fields.cue.body, Fields.cueBody.label, 2], slide.label, `slides[${slideIndex}] slide label`);

  const textElements = findTextElements(cueNode.children);
  const textElementsByLabel = new Map(textElements.map((element) => [element.label, element]));
  const usedTextElements = new Set<TextElementRef>();

  for (const text of slide.text) {
    const exactMatch = textElementsByLabel.get(text.label);
    const textElement = exactMatch ?? textElements.find((element) => !usedTextElements.has(element));
    if (!textElement) {
      const available = textElements.map((element) => element.label).join(", ") || "none";
      throw new Error(
        `slides[${slideIndex}] theme "${templateCue.label}" could not map text object "${text.label}". Available text objects: ${available}`
      );
    }

    usedTextElements.add(textElement);
    if (!exactMatch) {
      warnings.push(
        `slides[${slideIndex}] theme "${templateCue.label}" mapped text object "${text.label}" by position from template object "${textElement.label}"`
      );
      setString(textElement.labelNode, text.label);
    }
    setString(textElement.rtfNode, text.rtf);
  }

  return nodeToWire(cueNode);
}

function buildTemplateRoot(root: WireNode[], model: PresentationModel, cueFields: WireValue[]): WireNode[] {
  const fields: WireValue[] = [
    buildDocumentInfoFromTemplate(root),
    encodeMessageField(Fields.presentation.uuid, [encodeString(1, model.id)]),
    encodeString(Fields.presentation.title, model.title)
  ];

  for (const node of root) {
    if (
      node.field === Fields.presentation.documentInfo ||
      node.field === Fields.presentation.uuid ||
      node.field === Fields.presentation.title ||
      node.field === Fields.presentation.cueOrder ||
      node.field === Fields.presentation.cue
    ) {
      continue;
    }

    fields.push(nodeToWire(cloneNode(node)));
  }

  const cueOrder = buildCueOrder(model.slides);
  const cueInsertIndex = fields.findIndex((field) => field.field > Fields.presentation.cueOrder);
  if (cueInsertIndex === -1) {
    fields.push(cueOrder, ...cueFields);
  } else {
    fields.splice(cueInsertIndex, 0, cueOrder, ...cueFields);
  }

  return fields.map(wireToNode);
}

function buildDocumentInfoFromTemplate(root: WireNode[]): WireValue {
  const documentInfo = root.find((node) => node.field === Fields.presentation.documentInfo);
  if (!documentInfo) {
    return encodeMessageField(Fields.presentation.documentInfo, [
      encodeVarintField(1, 1),
      encodeMessageField(2, [
        encodeVarintField(1, 26),
        encodeVarintField(2, 3),
        encodeVarintField(3, 1)
      ]),
      encodeVarintField(3, 1),
      encodeMessageField(4, [
        encodeVarintField(1, 21),
        encodeVarintField(2, 3),
        encodeString(4, createNumericBuildId())
      ])
    ]);
  }

  return nodeToWire(cloneNode(documentInfo));
}

function findTextElements(nodes: WireNode[]): TextElementRef[] {
  const elements: TextElementRef[] = [];

  walkNodes(nodes, (node) => {
    if (node.type !== "length" || !node.children) {
      return;
    }

    const labelNode = node.children.find((child) => child.field === Fields.textElement.name);
    const textPayload = node.children.find((child) => child.field === Fields.textElement.text);
    if (!labelNode || !textPayload || textPayload.type !== "length" || !textPayload.children) {
      return;
    }

    const label = getString(labelNode);
    const rtfNode = textPayload.children.find((child) => child.field === 5);
    if (!label || !rtfNode || getString(rtfNode) === null) {
      return;
    }

    elements.push({ label, labelNode, rtfNode });
  });

  return elements;
}

function replaceUuidStrings(nodes: WireNode[]): void {
  const replacements = new Map<string, string>();

  walkNodes(nodes, (node) => {
    const value = getString(node);
    if (!value || !UUID_PATTERN.test(value)) {
      return;
    }

    const replacement = replacements.get(value) ?? createId();
    replacements.set(value, replacement);
    setString(node, replacement);
  });
}

function setRequiredString(nodes: WireNode[], path: number[], value: string, description: string): void {
  const node = findStringNodeAtPath(nodes, path);
  if (!node) {
    throw new Error(`Could not find ${description} at protobuf path ${path.join(".")}`);
  }

  setString(node, value);
}

function wireToNode(wire: WireValue): WireNode {
  return decodeTree(encodeMessage([wire]))[0];
}
