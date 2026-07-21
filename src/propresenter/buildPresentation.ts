import { create, toBinary, type MessageInitShape } from "@bufbuild/protobuf";
import {
  ApplicationInfo_Application,
  ApplicationInfo_Platform
} from "../generated/applicationInfo_pb.js";
import { Action_ActionType } from "../generated/action_pb.js";
import { Cue_CompletionActionType, type CueSchema } from "../generated/cue_pb.js";
import { type FontSchema } from "../generated/font_pb.js";
import {
  Graphics_Path_Shape_Type,
  Graphics_Text_Attributes_Alignment,
  Graphics_Text_Attributes_LigatureStyle,
  Graphics_Text_ChordPro_Notation,
  Graphics_Text_VerticalAlignment,
  type Graphics_PathSchema,
  type Graphics_ShadowSchema
} from "../generated/graphicsData_pb.js";
import { PresentationSchema } from "../generated/presentation_pb.js";
import { type Slide_ElementSchema } from "../generated/slide_pb.js";
import { URL_Platform } from "../generated/url_pb.js";
import { CANVAS, type PresentationModel, type SlideModel, type TextElementModel, type TextStyle } from "./model.js";
import { createId, createNumericBuildId } from "./ids.js";

const textEncoder = new TextEncoder();

export function buildPresentation(model: PresentationModel): Uint8Array {
  const presentation = create(PresentationSchema, {
    applicationInfo: {
      platform: ApplicationInfo_Platform.MACOS,
      platformVersion: { majorVersion: 26, minorVersion: 3, patchVersion: 1 },
      application: ApplicationInfo_Application.PROPRESENTER,
      applicationVersion: { majorVersion: 21, minorVersion: 3, build: createNumericBuildId() }
    },
    uuid: { string: model.id },
    name: model.title,
    background: { Fill: { case: "color", value: { alpha: 1 } } },
    chordChart: { platform: URL_Platform.MACOS },
    cueGroups: [
      {
        group: { uuid: { string: createId() }, hotKey: {} },
        cueIdentifiers: model.slides.map((slide) => ({ string: slide.cueId }))
      }
    ],
    cues: model.slides.map(buildCue),
    ccli: {},
    timeline: { duration: 300 }
  });

  return toBinary(PresentationSchema, presentation);
}

function buildCue(slide: SlideModel): MessageInitShape<typeof CueSchema> {
  return {
    uuid: { string: slide.cueId },
    completionActionType: Cue_CompletionActionType.LAST,
    hotKey: {},
    isEnabled: true,
    actions: [
      {
        uuid: { string: slide.id },
        label: { text: slide.label },
        isEnabled: true,
        type: Action_ActionType.PRESENTATION_SLIDE,
        ActionTypeData: {
          case: "slide",
          value: {
            Slide: {
              case: "presentation",
              value: {
                baseSlide: {
                  elements: slide.text.map(buildTextElement),
                  size: { width: CANVAS.width, height: CANVAS.height },
                  uuid: { string: createId() }
                },
                chordChart: { platform: URL_Platform.MACOS }
              }
            }
          }
        }
      }
    ]
  };
}

function buildTextElement(element: TextElementModel): MessageInitShape<typeof Slide_ElementSchema> {
  const style = element.style;

  return {
    element: {
      uuid: { string: element.id },
      name: element.label,
      bounds: {
        origin: { x: element.frame.x, y: element.frame.y },
        size: { width: element.frame.width, height: element.frame.height }
      },
      opacity: 1,
      path: rectanglePath(),
      fill: { FillType: { case: "color", value: { red: 0.13, green: 0.59, blue: 0.95, alpha: 1 } } },
      stroke: { width: 3, color: { red: 1, green: 1, blue: 1, alpha: 1 } },
      shadow: defaultShadow(),
      feather: { radius: 0.05 },
      text: {
        attributes: {
          font: buildFont(style),
          fill: { case: "textSolidFill", value: styleColor(style) },
          underlineStyle: {},
          paragraphStyle: {
            alignment: alignmentFor(style.alignment),
            lineHeightMultiple: 1,
            defaultTabInterval: 84,
            textList: {}
          },
          strikethroughStyle: {},
          customAttributes: [
            {
              range: { end: element.plainText.length },
              Attribute: { case: "originalFont", value: buildFont(style) }
            }
          ],
          ligatureStyle: Graphics_Text_Attributes_LigatureStyle.NONE
        },
        shadow: defaultShadow(),
        rtfData: textEncoder.encode(element.rtf),
        verticalAlignment: Graphics_Text_VerticalAlignment.MIDDLE,
        margins: {},
        isSuperscriptStandardized: true,
        transformDelimiter: "  •  ",
        chordPro: {
          notation: Graphics_Text_ChordPro_Notation.NUMBERS,
          color: styleColor(style)
        }
      },
      Mask: { case: "textLineMask", value: {} }
    },
    info: 3,
    textScroller: { scrollRate: 0.5, shouldRepeat: true, repeatDistance: 0.06172839506172839 }
  };
}

function buildFont(style: TextStyle): MessageInitShape<typeof FontSchema> {
  return { name: style.fontFamily, size: style.fontSize, family: style.fontDisplayName };
}

function styleColor(style: TextStyle) {
  return { red: style.color.r, green: style.color.g, blue: style.color.b, alpha: style.color.a };
}

function alignmentFor(alignment: TextStyle["alignment"]): Graphics_Text_Attributes_Alignment {
  if (alignment === "left") return Graphics_Text_Attributes_Alignment.LEFT;
  if (alignment === "right") return Graphics_Text_Attributes_Alignment.RIGHT;
  return Graphics_Text_Attributes_Alignment.CENTER;
}

function rectanglePath(): MessageInitShape<typeof Graphics_PathSchema> {
  return {
    closed: true,
    points: [
      { point: {}, q0: {}, q1: {} },
      { point: { x: 1 }, q0: { x: 1 }, q1: { x: 1 } },
      { point: { x: 1, y: 1 }, q0: { x: 1, y: 1 }, q1: { x: 1, y: 1 } },
      { point: { y: 1 }, q0: { y: 1 }, q1: { y: 1 } }
    ],
    shape: { type: Graphics_Path_Shape_Type.RECTANGLE }
  };
}

function defaultShadow(): MessageInitShape<typeof Graphics_ShadowSchema> {
  return { angle: 315, offset: 5, radius: 5, color: { alpha: 1 }, opacity: 0.75 };
}
