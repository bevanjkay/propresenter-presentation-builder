import type { SlideModel } from "./model.js";
import {
  encodeDouble,
  encodeMessageField,
  encodeString,
  encodeVarintField,
  type WireValue
} from "../protobuf/wire.js";
import { buildTextElement } from "./buildTextElement.js";
import { Fields } from "./fields.js";
import { createId } from "./ids.js";

export function buildCue(slide: SlideModel): WireValue {
  return encodeMessageField(Fields.presentation.cue, [
    encodeMessageField(Fields.cue.id, [encodeString(1, slide.cueId)]),
    encodeVarintField(Fields.cue.active, 1),
    encodeString(Fields.cue.notes, ""),
    encodeMessageField(Fields.cue.body, [
      encodeMessageField(Fields.cueBody.id, [encodeString(1, slide.id)]),
      encodeMessageField(Fields.cueBody.label, [encodeString(2, slide.label)]),
      encodeVarintField(Fields.cueBody.enabled, 1),
      encodeVarintField(Fields.cueBody.mediaType, 11),
      encodeSlideContent(slide)
    ]),
    encodeVarintField(Fields.cue.enabled, 1)
  ]);
}

export function buildCueOrder(slides: SlideModel[]): WireValue {
  return encodeMessageField(Fields.presentation.cueOrder, [
    encodeMessageField(1, [
      encodeMessageField(1, [encodeString(1, createId())]),
      encodeString(4, "")
    ]),
    ...slides.map((slide) => encodeMessageField(2, [encodeString(1, slide.cueId)]))
  ]);
}

function encodeSlideContent(slide: SlideModel): WireValue {
  return encodeMessageField(Fields.cueBody.slide, [
    encodeMessageField(2, [
      ...slide.text.map(buildTextElement),
      encodeMessageField(6, [
        encodeDouble(1, 1920),
        encodeDouble(2, 1080)
      ]),
      encodeMessageField(7, [encodeString(1, createId())])
    ]),
    encodeMessageField(4, [encodeVarintField(3, 1)])
  ]);
}
