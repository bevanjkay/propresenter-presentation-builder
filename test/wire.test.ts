import { describe, expect, it } from "vitest";
import {
  decodeMessage,
  encodeDouble,
  encodeFloat,
  encodeMessage,
  encodeMessageField,
  encodeString,
  encodeVarintField
} from "../src/protobuf/wire.js";

describe("protobuf wire helpers", () => {
  it("encodes and decodes varint fields", () => {
    const decoded = decodeMessage(encodeMessage([encodeVarintField(1, 150)]));

    expect(decoded).toEqual([{ type: "varint", field: 1, wireType: 0, value: 150 }]);
  });

  it("encodes strings", () => {
    const decoded = decodeMessage(encodeMessage([encodeString(2, "Title")]));

    expect(decoded[0]).toMatchObject({ type: "length", field: 2, wireType: 2 });
    expect(Buffer.from(decoded[0].type === "length" ? decoded[0].bytes : []).toString("utf8")).toBe("Title");
  });

  it("encodes nested messages", () => {
    const decoded = decodeMessage(encodeMessage([
      encodeMessageField(3, [encodeString(1, "Nested")])
    ]));

    expect(decoded[0]).toMatchObject({ type: "length", field: 3 });
    const nested = decodeMessage(decoded[0].type === "length" ? decoded[0].bytes : new Uint8Array());
    expect(nested[0]).toMatchObject({ type: "length", field: 1 });
  });

  it("encodes fixed width numeric fields", () => {
    const decoded = decodeMessage(encodeMessage([encodeDouble(1, 1.5), encodeFloat(2, 2.5)]));

    expect(decoded[0]).toMatchObject({ type: "fixed64", field: 1, wireType: 1 });
    expect(decoded[1]).toMatchObject({ type: "fixed32", field: 2, wireType: 5 });
  });
});
