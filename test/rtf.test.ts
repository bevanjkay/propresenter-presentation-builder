import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_STYLE } from "../src/propresenter/model.js";
import { buildRtf, escapeRtf } from "../src/propresenter/rtf.js";

describe("RTF generation", () => {
  it("builds styled RTF for plain text", () => {
    const rtf = buildRtf("Hello", DEFAULT_TEXT_STYLE);

    expect(rtf).toContain("{\\rtf1");
    expect(rtf).toContain("\\f0\\fs84");
    expect(rtf).toContain("Hello}");
  });

  it("writes the default white style as a grayscale color table", () => {
    const rtf = buildRtf("Hello", DEFAULT_TEXT_STYLE);

    expect(rtf).toContain("{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}");
    expect(rtf).toContain("{\\*\\expandedcolortbl;;\\csgray\\c100000;}");
  });

  it("derives the color table from the text color", () => {
    const rtf = buildRtf("Hello", {
      ...DEFAULT_TEXT_STYLE,
      color: { r: 1, g: 0.8784313797950745, b: 0.3803921639919281, a: 1 }
    });

    expect(rtf).toContain("{\\colortbl;\\red255\\green255\\blue255;\\red255\\green224\\blue97;}");
    expect(rtf).toContain("{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c87843\\c38039;}");
  });

  it("escapes braces", () => {
    expect(escapeRtf("{hello}")).toBe("\\{hello\\}");
  });

  it("escapes backslashes", () => {
    expect(escapeRtf("a\\b")).toBe("a\\\\b");
  });

  it("escapes multiline text", () => {
    expect(escapeRtf("a\nb")).toBe("a\\line b");
  });

  it("encodes non-ASCII text", () => {
    expect(escapeRtf("café")).toBe("caf\\u233?");
  });
});
