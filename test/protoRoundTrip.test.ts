import { readFileSync } from "node:fs";
import { equals, fromBinary, toBinary } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import { PresentationSchema } from "../src/generated/presentation_pb.js";
import { parsePresentationInput } from "../src/inputSchema.js";
import { buildPresentation } from "../src/propresenter/buildPresentation.js";
import { createPresentationModel } from "../src/propresenter/createModel.js";

describe("generated rv.data.Presentation schema", () => {
  it("decodes Template.pro with typed fields", () => {
    const presentation = fromBinary(PresentationSchema, readFileSync("Template.pro"));

    expect(presentation.name).toBe("Template");
    expect(presentation.uuid?.string).toBe("7FC685D4-B130-4D83-8CA4-D4AC7980F981");
    expect(presentation.cues).toHaveLength(4);
    expect(presentation.cues.map((cue) => cue.actions[0]?.label?.text)).toEqual([
      "Point",
      "Verse",
      "Title",
      "Subpoint"
    ]);
  });

  it("round-trips Template.pro byte-identically", () => {
    const original = readFileSync("Template.pro");
    const presentation = fromBinary(PresentationSchema, original);
    const reEncoded = toBinary(PresentationSchema, presentation);

    expect(Buffer.from(reEncoded).equals(original)).toBe(true);

    const reDecoded = fromBinary(PresentationSchema, reEncoded);
    expect(equals(PresentationSchema, presentation, reDecoded)).toBe(true);
  });

  it("decodes generator output against the real schema", () => {
    const parsed = parsePresentationInput(JSON.parse(readFileSync("input.json", "utf8")));
    const { model } = createPresentationModel(parsed.slides, "Schema Check");
    const presentation = fromBinary(PresentationSchema, buildPresentation(model));

    expect(presentation.name).toBe("Schema Check");
    expect(presentation.cues).toHaveLength(model.slides.length);
    expect(presentation.uuid?.string).toBe(model.id);
  });
});
