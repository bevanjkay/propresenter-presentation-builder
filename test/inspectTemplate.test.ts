import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inspectTemplate } from "../src/propresenter/inspectTemplate.js";

describe("inspectTemplate", () => {
  it("discovers cues and known text objects from Template.pro", () => {
    const inspection = inspectTemplate(readFileSync("Template.pro"));

    expect(inspection.title).toBe("Template");
    expect(inspection.cueCount).toBe(3);
    expect(inspection.cueLabels).toEqual(expect.arrayContaining(["Title", "Point", "John 3:16"]));
    expect(inspection.textObjectLabels).toEqual(expect.arrayContaining(["Title", "Point", "Reference", "Verse"]));
    expect(inspection.rtfPaths.length).toBeGreaterThan(0);
  });
});
