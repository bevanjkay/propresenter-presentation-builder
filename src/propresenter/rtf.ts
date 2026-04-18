import type { TextStyle } from "./model.js";

export function buildRtf(text: string, style: TextStyle): string {
  const alignment = alignmentControl(style.alignment);
  const fontSizeHalfPoints = Math.round(style.fontSize * 2);

  return [
    "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2868",
    "\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 ",
    style.fontFamily,
    ";}",
    "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}",
    "{\\*\\expandedcolortbl;;\\csgray\\c100000;}",
    "\\deftab1680",
    `\\pard\\pardeftab1680\\pardirnatural\\${alignment}\\partightenfactor0`,
    "",
    `\\f0\\fs${fontSizeHalfPoints} \\cf2 \\CocoaLigature0 ${escapeRtf(text)}}`
  ].join("\n");
}

export function escapeRtf(text: string): string {
  let escaped = "";

  for (const char of text) {
    if (char === "\\") {
      escaped += "\\\\";
    } else if (char === "{") {
      escaped += "\\{";
    } else if (char === "}") {
      escaped += "\\}";
    } else if (char === "\n") {
      escaped += "\\line ";
    } else if (char === "\r") {
      continue;
    } else if (char.charCodeAt(0) > 0x7f) {
      escaped += encodeUnicodeForRtf(char);
    } else {
      escaped += char;
    }
  }

  return escaped;
}

function alignmentControl(alignment: TextStyle["alignment"]): string {
  if (alignment === "left") return "ql";
  if (alignment === "right") return "qr";
  return "qc";
}

function encodeUnicodeForRtf(char: string): string {
  const units: string[] = [];
  for (let index = 0; index < char.length; index += 1) {
    const codeUnit = char.charCodeAt(index);
    const signed = codeUnit > 0x7fff ? codeUnit - 0x10000 : codeUnit;
    units.push(`\\u${signed}?`);
  }
  return units.join("");
}
