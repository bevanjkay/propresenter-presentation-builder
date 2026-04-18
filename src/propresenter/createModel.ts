import type { SlideInput } from "../inputSchema.js";
import { buildLayouts } from "./layouts.js";
import type { PresentationModel } from "./model.js";
import { buildRtf } from "./rtf.js";
import { createId } from "./ids.js";

export type ModelBuildResult = {
  model: PresentationModel;
  warnings: string[];
};

export function createPresentationModel(
  slides: SlideInput[],
  title = "Generated Presentation"
): ModelBuildResult {
  const warnings: string[] = [];

  const model: PresentationModel = {
    id: createId(),
    title,
    slides: slides.map((slide, slideIndex) => {
      const layouts = buildLayouts(slide.text.length);
      const label = slide.label?.trim() ?? "";
      if (label === "") {
        warnings.push(`slides[${slideIndex}].label is empty; generated slide label will be blank`);
      }
      if (slide.text.length > 3) {
        warnings.push(`slides[${slideIndex}] has ${slide.text.length} text fields; stacked fallback layout was used`);
      }

      return {
        id: createId(),
        cueId: createId(),
        label,
        text: slide.text.map((item, textIndex) => {
          const layout = layouts[textIndex];
          return {
            id: createId(),
            label: item.label,
            plainText: item.text,
            style: layout.style,
            frame: layout.frame,
            rtf: buildRtf(item.text, layout.style)
          };
        })
      };
    })
  };

  return { model, warnings };
}
