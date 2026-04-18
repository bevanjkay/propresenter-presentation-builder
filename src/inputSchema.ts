import { z } from "zod";

export type TextInput = {
  label: string;
  text: string;
};

export type SlideInput = {
  label?: string;
  text: TextInput[];
};

export type ParsedInput = {
  slides: SlideInput[];
  warnings: string[];
};

const textItemSchema = z.object({
  label: z.string().min(1, "text item label is required"),
  text: z.string()
});

const slideSchema = z.object({
  label: z.string().optional(),
  text: z.unknown()
});

const presentationSchema = z.array(slideSchema).superRefine((slides, context) => {
  slides.forEach((slide, slideIndex) => {
    const textPath = [slideIndex, "text"];
    if (slide.text === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: textPath,
        message: "text is required"
      });
      return;
    }

    const items = Array.isArray(slide.text) ? slide.text : [slide.text];
    if (items.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: textPath,
        message: "text must include at least one item"
      });
      return;
    }

    items.forEach((item, itemIndex) => {
      const parsed = textItemSchema.safeParse(item);
      if (parsed.success) return;

      for (const issue of parsed.error.issues) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...textPath, itemIndex, ...issue.path],
          message: issue.message
        });
      }
    });
  });
});

export function parsePresentationInput(value: unknown): ParsedInput {
  const parsed = presentationSchema.safeParse(value);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${formatPath(issue.path)}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid input JSON:\n${details}`);
  }

  const warnings: string[] = [];
  const slides = parsed.data.map((slide, index) => {
    if (Array.isArray(slide.text)) {
      return {
        label: slide.label,
        text: slide.text as TextInput[]
      };
    }

    warnings.push(`slides[${index}].text was a single object and was normalized to a one-item array`);
    return {
      label: slide.label,
      text: [slide.text as TextInput]
    };
  });

  return { slides, warnings };
}

function formatPath(path: Array<string | number>): string {
  if (path.length === 0) {
    return "$";
  }

  return path.reduce<string>((current, part) => {
    if (typeof part === "number") {
      return `${current}[${part}]`;
    }
    return `${current}.${part}`;
  }, "$");
}
