import { fromBinary } from "@bufbuild/protobuf";
import { PresentationSchema } from "../generated/presentation_pb.js";

export type TemplateElementInspection = {
  name: string;
  fontName: string | null;
  fontSize: number | null;
  hasRtf: boolean;
  bounds: { x: number; y: number; width: number; height: number } | null;
};

export type TemplateCueInspection = {
  label: string;
  elements: TemplateElementInspection[];
};

export type TemplateInspection = {
  title: string;
  uuid: string | null;
  applicationVersion: string | null;
  cueCount: number;
  cueLabels: string[];
  textObjectLabels: string[];
  cues: TemplateCueInspection[];
};

export function inspectTemplate(bytes: Uint8Array): TemplateInspection {
  const presentation = fromBinary(PresentationSchema, bytes);

  const cues: TemplateCueInspection[] = presentation.cues.map((cue) => {
    const action = cue.actions.find(
      (candidate) => candidate.ActionTypeData.case === "slide"
    );
    const slide =
      action?.ActionTypeData.case === "slide" &&
      action.ActionTypeData.value.Slide.case === "presentation"
        ? action.ActionTypeData.value.Slide.value.baseSlide
        : undefined;

    return {
      label: action?.label?.text ?? "",
      elements: (slide?.elements ?? []).map((element) => {
        const graphics = element.element;
        const font = graphics?.text?.attributes?.font;
        const bounds = graphics?.bounds;
        return {
          name: graphics?.name ?? "",
          fontName: font?.name || null,
          fontSize: font?.size || null,
          hasRtf: (graphics?.text?.rtfData.length ?? 0) > 0,
          bounds:
            bounds?.origin && bounds.size
              ? {
                  x: bounds.origin.x,
                  y: bounds.origin.y,
                  width: bounds.size.width,
                  height: bounds.size.height
                }
              : null
        };
      })
    };
  });

  const version = presentation.applicationInfo?.applicationVersion;

  return {
    title: presentation.name,
    uuid: presentation.uuid?.string ?? null,
    applicationVersion: version
      ? `${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`
      : null,
    cueCount: presentation.cues.length,
    cueLabels: cues.map((cue) => cue.label),
    textObjectLabels: [...new Set(cues.flatMap((cue) => cue.elements.map((element) => element.name)))],
    cues
  };
}

export function formatInspection(inspection: TemplateInspection): string {
  const lines = [
    `Title: ${inspection.title || "(untitled)"}`,
    `UUID: ${inspection.uuid ?? "(none)"}`,
    `ProPresenter version: ${inspection.applicationVersion ?? "(unknown)"}`,
    `Cue count: ${inspection.cueCount}`,
    ""
  ];

  for (const cue of inspection.cues) {
    lines.push(`Cue: ${cue.label || "(unlabeled)"}`);
    for (const element of cue.elements) {
      const font =
        element.fontName === null ? "no font" : `${element.fontName} ${element.fontSize ?? "?"}pt`;
      const bounds = element.bounds
        ? `${element.bounds.width}x${element.bounds.height} at (${element.bounds.x}, ${element.bounds.y})`
        : "no bounds";
      lines.push(`  Text object: ${element.name || "(unnamed)"} — ${font}, ${bounds}${element.hasRtf ? ", has RTF" : ""}`);
    }
  }

  return lines.join("\n");
}
