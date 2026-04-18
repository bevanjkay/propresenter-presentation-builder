import { describe, expect, it } from "vitest";
import { parsePresentationInput } from "../src/inputSchema.js";

describe("parsePresentationInput", () => {
  it("accepts array text items", () => {
    const result = parsePresentationInput([
      { label: "Slide", text: [{ label: "Title", text: "Hello" }] }
    ]);

    expect(result.slides[0].text).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it("preserves optional theme keys", () => {
    const result = parsePresentationInput([
      { label: "Slide", theme: "Title", text: [{ label: "Title", text: "Hello" }] }
    ]);

    expect(result.slides[0].theme).toBe("Title");
  });

  it("normalizes a single text object", () => {
    const result = parsePresentationInput([
      { label: "Slide", text: { label: "Title", text: "Hello" } }
    ]);

    expect(result.slides[0].text).toEqual([{ label: "Title", text: "Hello" }]);
    expect(result.warnings[0]).toContain("normalized");
  });

  it("rejects a missing text field", () => {
    expect(() => parsePresentationInput([{ label: "Slide" }])).toThrow("Invalid input JSON");
  });

  it("rejects a missing text item label", () => {
    expect(() => parsePresentationInput([{ text: [{ text: "Hello" }] }])).toThrow("$[0].text[0].label");
  });

  it("rejects a missing text item text", () => {
    expect(() => parsePresentationInput([{ text: [{ label: "Title" }] }])).toThrow("Invalid input JSON");
  });
});
