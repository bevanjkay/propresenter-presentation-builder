import type { PresentationModel } from "./model.js";
import {
  encodeFloat,
  encodeMessage,
  encodeMessageField,
  encodeString,
  encodeVarintField
} from "../protobuf/wire.js";
import { buildCue, buildCueOrder } from "./buildCue.js";
import { Fields } from "./fields.js";
import { createNumericBuildId } from "./ids.js";

export function buildPresentation(model: PresentationModel): Uint8Array {
  return encodeMessage([
    buildDocumentInfo(),
    encodeMessageField(Fields.presentation.uuid, [encodeString(1, model.id)]),
    encodeString(Fields.presentation.title, model.title),
    encodeMessageField(Fields.presentation.scale, [
      encodeMessageField(1, [encodeFloat(4, 1)])
    ]),
    encodeMessageField(Fields.presentation.options, [encodeVarintField(3, 1)]),
    buildCueOrder(model.slides),
    ...model.slides.map(buildCue),
    encodeString(Fields.presentation.notes, ""),
    encodeMessageField(Fields.presentation.size, [encodeDoubleFieldFive(300)])
  ]);
}

function buildDocumentInfo() {
  return encodeMessageField(Fields.presentation.documentInfo, [
    encodeVarintField(1, 1),
    encodeMessageField(2, [
      encodeVarintField(1, 26),
      encodeVarintField(2, 3),
      encodeVarintField(3, 1)
    ]),
    encodeVarintField(3, 1),
    encodeMessageField(4, [
      encodeVarintField(1, 21),
      encodeVarintField(2, 3),
      encodeString(4, createNumericBuildId())
    ])
  ]);
}

function encodeDoubleFieldFive(value: number) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, true);
  return { type: "fixed64" as const, field: 5, bytes };
}
