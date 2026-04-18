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
