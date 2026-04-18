import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePresentationInput } from "../src/inputSchema.js";
import { decodeMessage } from "../src/protobuf/wire.js";
import { buildPresentation } from "../src/propresenter/buildPresentation.js";
import { createPresentationModel } from "../src/propresenter/createModel.js";

describe("presentation generation", () => {
  it("generates decodable .pro bytes from input.json", () => {
    const input = JSON.parse(readFileSync("input.json", "utf8"));
    const parsed = parsePresentationInput(input);
    const { model } = createPresentationModel(parsed.slides, "Generated Presentation");
    const bytes = buildPresentation(model);
    const decoded = decodeMessage(bytes);

    expect(decoded.filter((field) => field.field === 13)).toHaveLength(parsed.slides.length);

    const text = Buffer.from(bytes).toString("utf8");
    expect(text).toContain("The Great Gatsby");
    expect(text).toContain("A.W. Tozer");
    expect(text).toContain("What comes into our minds");
    expect(text).not.toContain("7FC685D4-B130-4D83-8CA4-D4AC7980F981");

    const protocOutput = execFileSync("protoc", ["--decode_raw"], {
      input: Buffer.from(bytes),
      encoding: "utf8"
    });
    expect(protocOutput).toContain("Generated Presentation");
  });
});
