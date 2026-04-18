import { CANVAS, DEFAULT_TEXT_STYLE, type Frame, type TextStyle } from "./model.js";

export type LayoutItem = {
  frame: Frame;
  style: TextStyle;
};

export function buildLayouts(count: number): LayoutItem[] {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [
      {
        frame: centeredFrame(0.1, 0.25, 0.8, 0.5),
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 54 }
      }
    ];
  }

  if (count === 2) {
    return [
      {
        frame: centeredFrame(0.12, 0.13, 0.76, 0.18),
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 34 }
      },
      {
        frame: centeredFrame(0.1, 0.34, 0.8, 0.48),
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 42 }
      }
    ];
  }

  const verticalMargin = 0.12 * CANVAS.height;
  const gap = 0.035 * CANVAS.height;
  const availableHeight = CANVAS.height - verticalMargin * 2 - gap * (count - 1);
  const itemHeight = Math.max(120, availableHeight / count);
  const fontSize = count <= 4 ? 34 : 28;

  return Array.from({ length: count }, (_, index) => ({
    frame: {
      x: CANVAS.width * 0.12,
      y: verticalMargin + index * (itemHeight + gap),
      width: CANVAS.width * 0.76,
      height: itemHeight
    },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: index === 0 && count <= 3 ? fontSize - 4 : fontSize
    }
  }));
}

function centeredFrame(xPct: number, yPct: number, widthPct: number, heightPct: number): Frame {
  return {
    x: CANVAS.width * xPct,
    y: CANVAS.height * yPct,
    width: CANVAS.width * widthPct,
    height: CANVAS.height * heightPct
  };
}
