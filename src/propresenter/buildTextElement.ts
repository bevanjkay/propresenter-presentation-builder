import type { TextElementModel } from "./model.js";
import {
  encodeDouble,
  encodeFloat,
  encodeMessageField,
  encodeString,
  encodeVarintField,
  type WireValue
} from "../protobuf/wire.js";
import { Fields } from "./fields.js";

export function buildTextElement(element: TextElementModel): WireValue {
  return encodeMessageField(1, [
    encodeMessageField(1, [
      encodeMessageField(1, [
        encodeMessageField(Fields.textElement.id, [encodeString(1, element.id)]),
        encodeString(Fields.textElement.name, element.label),
        encodeFrame(element),
        encodeDouble(Fields.textElement.opacity, 1),
        encodeFill(),
        encodeBorder(),
        encodeShadow(),
        encodeTransform(),
        encodeCornerRadius(),
        encodeTextPayload(element),
        encodeString(Fields.textElement.notes, "")
      ]),
      encodeVarintField(4, 3),
      encodeMessageField(9, [
        encodeDouble(2, 0.5),
        encodeVarintField(3, 1),
        encodeDouble(4, 0.061928666074871374)
      ])
    ])
  ]);
}

function encodeFrame(element: TextElementModel): WireValue {
  return encodeMessageField(Fields.textElement.frame, [
    encodeMessageField(1, [
      encodeDouble(1, element.frame.x),
      encodeDouble(2, element.frame.y)
    ]),
    encodeMessageField(2, [
      encodeDouble(1, element.frame.width),
      encodeDouble(2, element.frame.height)
    ])
  ]);
}

function encodeFill(): WireValue {
  return encodeMessageField(Fields.textElement.fill, [
    encodeVarintField(1, 1),
    encodeMessageField(2, [
      encodeString(1, ""),
      encodeString(2, ""),
      encodeString(3, "")
    ]),
    encodeMessageField(2, [
      encodeMessageField(1, [encodeDouble(1, 1)]),
      encodeMessageField(2, [encodeDouble(1, 1)]),
      encodeMessageField(3, [encodeDouble(1, 1)])
    ]),
    encodeMessageField(2, [
      encodeMessageField(1, [encodeDouble(1, 1), encodeDouble(2, 1)]),
      encodeMessageField(2, [encodeDouble(1, 1), encodeDouble(2, 1)]),
      encodeMessageField(3, [encodeDouble(1, 1), encodeDouble(2, 1)])
    ]),
    encodeMessageField(2, [
      encodeMessageField(1, [encodeDouble(2, 1)]),
      encodeMessageField(2, [encodeDouble(2, 1)]),
      encodeMessageField(3, [encodeDouble(2, 1)])
    ]),
    encodeMessageField(3, [encodeVarintField(1, 1)])
  ]);
}

function encodeBorder(): WireValue {
  return encodeMessageField(Fields.textElement.border, [
    encodeMessageField(1, [
      encodeFloat(1, 0.13),
      encodeFloat(2, 0.59),
      encodeFloat(3, 0.95),
      encodeFloat(4, 1)
    ])
  ]);
}

function encodeShadow(): WireValue {
  return encodeMessageField(Fields.textElement.shadow, [
    encodeDouble(2, 3),
    encodeMessageField(3, [
      encodeFloat(1, 1),
      encodeFloat(2, 1),
      encodeFloat(3, 1),
      encodeFloat(4, 1)
    ])
  ]);
}

function encodeTransform(): WireValue {
  return encodeTransformAtField(Fields.textElement.transform);
}

function encodeTransformAtField(field: number): WireValue {
  return encodeMessageField(field, [
    encodeDouble(2, 315),
    encodeDouble(3, 5),
    encodeDouble(4, 5),
    encodeMessageField(5, [encodeFloat(4, 1)]),
    encodeDouble(6, 0.75)
  ]);
}

function encodeCornerRadius(): WireValue {
  return encodeMessageField(Fields.textElement.cornerRadius, [encodeDouble(2, 0.05)]);
}

function encodeTextPayload(element: TextElementModel): WireValue {
  const style = element.style;

  return encodeMessageField(Fields.textElement.text, [
    encodeMessageField(3, [
      encodeMessageField(1, [
        encodeString(1, style.fontFamily),
        encodeDouble(2, style.fontSize),
        encodeString(9, style.fontDisplayName)
      ]),
      encodeMessageField(3, [
        encodeFloat(1, style.color.r),
        encodeFloat(2, style.color.g),
        encodeFloat(3, style.color.b),
        encodeFloat(4, style.color.a)
      ]),
      encodeString(4, ""),
      encodeMessageField(6, [
        encodeVarintField(1, 2),
        encodeDouble(5, 1),
        encodeDouble(12, style.fontSize * 2),
        encodeString(13, "")
      ]),
      encodeString(9, ""),
      encodeVarintField(19, 1)
    ]),
    encodeTransformAtField(4),
    encodeString(5, element.rtf),
    encodeVarintField(6, 1),
    encodeString(8, ""),
    encodeVarintField(9, 1),
    encodeString(11, "  •  "),
    encodeMessageField(12, [
      encodeDouble(2, 1),
      encodeMessageField(3, [
        encodeFloat(1, style.color.r),
        encodeFloat(2, Math.max(0, style.color.g - 0.000001)),
        encodeFloat(3, style.color.b),
        encodeFloat(4, style.color.a)
      ])
    ])
  ]);
}
