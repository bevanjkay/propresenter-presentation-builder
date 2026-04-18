import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePresentationInput } from "../src/inputSchema.js";
import { decodeMessage } from "../src/protobuf/wire.js";
import { buildPresentation } from "../src/propresenter/buildPresentation.js";
import { createPresentationModel } from "../src/propresenter/createModel.js";
import { buildPresentationWithTemplate } from "../src/propresenter/templateRenderer.js";

describe("presentation generation", () => {
  it("generates decodable .pro bytes from input.json", () => {
    const input = JSON.parse(readFileSync("input.json", "utf8"));
    const parsed = parsePresentationInput(input);
    const { model } = createPresentationModel(parsed.slides, "Generated Presentation");
    const bytes = buildPresentation(model);
    const decoded = decodeMessage(bytes);

    expect(decoded.filter((field) => field.field === 13)).toHaveLength(parsed.slides.length);

    const text = Buffer.from(bytes).toString("utf8");
    expect(text).not.toContain("7FC685D4-B130-4D83-8CA4-D4AC7980F981");

    const protocOutput = execFileSync("protoc", ["--decode_raw"], {
      input: Buffer.from(bytes),
      encoding: "utf8"
    });
    expect(protocOutput).toContain("Generated Presentation");
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

describe("template theme generation", () => {
  it("uses a template cue when slide theme matches the template slide label", () => {
    const slides = [
      { label: "Generated Title", theme: "Title", text: [{ label: "Title", text: "Themed title text" }] }
    ];
    const { model } = createPresentationModel(slides, "Themed Presentation");
    const result = buildPresentationWithTemplate(model, slides, readFileSync("Template.pro"));
    const decoded = decodeMessage(result.bytes);
    const output = Buffer.from(result.bytes).toString("utf8");

    expect(result.themedSlideCount).toBe(1);
    expect(decoded.filter((field) => field.field === 13)).toHaveLength(1);
    expect(output).toContain("Generated Title");
    expect(output).toContain("Themed title text");
    expect(output).not.toContain("Title Text");
    expect(execFileSync("protoc", ["--decode_raw"], { input: Buffer.from(result.bytes), encoding: "utf8" })).toContain("Themed Presentation");
  });

  it("fails when a requested theme does not exist in the template", () => {
    const slides = [
      { label: "Generated Title", theme: "Missing", text: [{ label: "Title", text: "Themed title text" }] }
    ];
    const { model } = createPresentationModel(slides, "Themed Presentation");

    expect(() => buildPresentationWithTemplate(model, slides, readFileSync("Template.pro"))).toThrow(
      'theme "Missing" did not match'
    );
  });

  it("fails when the themed template slide is missing a requested text object", () => {
    const slides = [
      {
        label: "Generated Title",
        theme: "Title",
        text: [
          { label: "FirstText", text: "Themed title text" },
          { label: "SecondText", text: "Second text" }
        ]
      }
    ];
    const { model } = createPresentationModel(slides, "Themed Presentation");

    expect(() => buildPresentationWithTemplate(model, slides, readFileSync("Template.pro"))).toThrow(
      'could not map text object "SecondText"'
    );
  });
});
