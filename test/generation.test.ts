import { readFileSync } from "node:fs";
import { fromBinary } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import { PresentationSchema } from "../src/generated/presentation_pb.js";
import { parsePresentationInput } from "../src/inputSchema.js";
import { buildPresentation } from "../src/propresenter/buildPresentation.js";
import { createPresentationModel } from "../src/propresenter/createModel.js";

describe("presentation generation", () => {
  it("generates schema-valid .pro bytes from input.json", () => {
    const input = JSON.parse(readFileSync("input.json", "utf8"));
    const parsed = parsePresentationInput(input);
    const { model } = createPresentationModel(parsed.slides, "Generated Presentation");
    const bytes = buildPresentation(model);
    const presentation = fromBinary(PresentationSchema, bytes);

    expect(presentation.name).toBe("Generated Presentation");
    expect(presentation.cues).toHaveLength(parsed.slides.length);

    const text = Buffer.from(bytes).toString("utf8");
    expect(text).not.toContain("7FC685D4-B130-4D83-8CA4-D4AC7980F981");
  });

  it("includes generated ASCII text content", () => {
    const parsed = parsePresentationInput([
      { label: "Title", text: { label: "Title", text: "The Great Gatsby" } },
      { label: "Quote", text: [{ label: "Author", text: "A.W. Tozer" }] }
    ]);
    const { model } = createPresentationModel(parsed.slides, "Generated Presentation");
    const output = Buffer.from(buildPresentation(model)).toString("utf8");

    expect(output).toContain("The Great Gatsby");
    expect(output).toContain("A.W. Tozer");
  });
});
