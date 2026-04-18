import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inspectTemplate } from "../src/propresenter/inspectTemplate.js";

describe("inspectTemplate", () => {
  it("discovers cues and known text objects from Template.pro", () => {
    const inspection = inspectTemplate(readFileSync("Template.pro"));

    expect(inspection.title).toBe("Template");
    expect(inspection.cueCount).toBeGreaterThan(0);
    expect(inspection.cueLabels).toEqual(expect.arrayContaining(["Title", "Point"]));
    expect(inspection.textObjectLabels.length).toBeGreaterThan(0);
    expect(inspection.rtfPaths.length).toBeGreaterThan(0);
  });
});
