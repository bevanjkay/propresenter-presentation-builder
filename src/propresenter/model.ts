export type PresentationModel = {
  id: string;
  title: string;
  slides: SlideModel[];
};

export type SlideModel = {
  id: string;
  cueId: string;
  label: string;
  text: TextElementModel[];
};

export type TextElementModel = {
  id: string;
  label: string;
  plainText: string;
  rtf: string;
  frame: Frame;
  style: TextStyle;
};

export type Frame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextStyle = {
  fontFamily: string;
  fontDisplayName: string;
  fontSize: number;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  alignment: "left" | "center" | "right";
};

export const CANVAS = {
  width: 1920,
  height: 1080
} as const;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "HelveticaNeue",
  fontDisplayName: "Helvetica Neue",
  fontSize: 42,
  color: { r: 1, g: 1, b: 1, a: 1 },
  alignment: "center"
};
