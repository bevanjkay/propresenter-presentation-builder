import { decodeMessage, decodeUtf8, tryDecodeMessage, type DecodedWireValue } from "../protobuf/wire.js";
import { Fields } from "./fields.js";

export type TemplateInspection = {
  title: string | null;
  topLevelFields: Array<{ field: number; type: string; size?: number }>;
  cueCount: number;
  cueLabels: string[];
  textObjectLabels: string[];
  rtfPaths: string[];
  geometryPaths: string[];
  candidateFields: typeof Fields;
};

type StringAtPath = {
  path: number[];
  value: string;
};

export function inspectTemplate(bytes: Uint8Array): TemplateInspection {
  const fields = decodeMessage(bytes);
  const strings = collectStrings(fields);
  const cueFields = fields.filter(
    (field): field is Extract<DecodedWireValue, { type: "length" }> =>
      field.field === Fields.presentation.cue && field.type === "length"
  );

  return {
    title: strings.find((item) => pathEquals(item.path, [Fields.presentation.title]))?.value ?? null,
    topLevelFields: fields.map((field) => ({
      field: field.field,
      type: field.type,
      size: field.type === "length" ? field.bytes.length : undefined
    })),
    cueCount: cueFields.length,
    cueLabels: cueFields
      .map((cue) => findStringAtPath(cue.bytes, [Fields.cue.body, Fields.cueBody.label, 2]))
      .filter((label): label is string => label !== null),
    textObjectLabels: unique(
      cueFields.flatMap((cue) =>
        collectStrings(decodeMessage(cue.bytes))
          .filter((item) => pathEndsWith(item.path, [Fields.cue.body, Fields.cueBody.slide, 2, 1, 1, 1, Fields.textElement.name]))
          .map((item) => item.value)
      )
    ),
    rtfPaths: unique(
      strings
        .filter((item) => item.value.startsWith("{\\rtf1"))
        .map((item) => formatPath(item.path))
    ),
    geometryPaths: unique(
      collectGeometryCandidatePaths(cueFields)
        .map(formatPath)
    ),
    candidateFields: Fields
  };
}

export function formatInspection(inspection: TemplateInspection): string {
  return [
    `Title: ${inspection.title ?? "(unknown)"}`,
    `Cue count: ${inspection.cueCount}`,
    "",
    "Top-level fields:",
    ...inspection.topLevelFields.map((field) =>
      `  ${field.field}: ${field.type}${field.size === undefined ? "" : ` (${field.size} bytes)`}`
    ),
    "",
    "Cue labels:",
    ...formatList(inspection.cueLabels),
    "",
    "Text object labels:",
    ...formatList(inspection.textObjectLabels),
    "",
    "RTF field paths:",
    ...formatList(inspection.rtfPaths),
    "",
    "Geometry-like field paths:",
    ...formatList(inspection.geometryPaths),
    "",
    "Candidate field constants:",
    JSON.stringify(inspection.candidateFields, null, 2)
  ].join("\n");
}

function findStringAtPath(bytes: Uint8Array, path: number[]): string | null {
  return collectStrings(decodeMessage(bytes)).find((item) => pathEquals(item.path, path))?.value ?? null;
}

function collectStrings(fields: DecodedWireValue[], parentPath: number[] = [], depth = 0): StringAtPath[] {
  if (depth > 16) {
    return [];
  }

  const strings: StringAtPath[] = [];
  for (const field of fields) {
    const path = [...parentPath, field.field];
    if (field.type !== "length") {
      continue;
    }

    const text = decodeUtf8(field.bytes);
    if (text !== null && isUsefulText(text)) {
      strings.push({ path, value: text });
    }

    const nested = tryDecodeMessage(field.bytes);
    if (nested !== null && nested.length > 0) {
      strings.push(...collectStrings(nested, path, depth + 1));
    }
  }

  return strings;
}

function collectGeometryCandidatePaths(cueFields: DecodedWireValue[]): number[][] {
  const paths: number[][] = [];
  for (const cue of cueFields) {
    if (cue.type !== "length") continue;
    const all = collectNestedFields(decodeMessage(cue.bytes));
    for (const item of all) {
      if (pathEndsWith(item.path, [Fields.textElement.frame, 1, 1]) || pathEndsWith(item.path, [Fields.textElement.frame, 2, 1])) {
        paths.push(item.path);
      }
    }
  }
  return paths;
}

function collectNestedFields(fields: DecodedWireValue[], parentPath: number[] = [], depth = 0): Array<{ path: number[] }> {
  if (depth > 16) return [];
  const output: Array<{ path: number[] }> = [];

  for (const field of fields) {
    const path = [...parentPath, field.field];
    output.push({ path });
    if (field.type !== "length") continue;
    const nested = tryDecodeMessage(field.bytes);
    if (nested) {
      output.push(...collectNestedFields(nested, path, depth + 1));
    }
  }

  return output;
}

function isUsefulText(value: string): boolean {
  if (value.length === 0) return true;
  return /^[\x09\x0a\x0d\x20-\x7e\u0080-\uffff]+$/.test(value);
}

function formatPath(path: number[]): string {
  return path.join(".");
}

function pathEquals(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function pathEndsWith(path: number[], suffix: number[]): boolean {
  if (suffix.length > path.length) return false;
  return suffix.every((value, index) => value === path[path.length - suffix.length + index]);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function formatList(values: string[]): string[] {
  return values.length === 0 ? ["  (none found)"] : values.map((value) => `  ${value}`);
}
