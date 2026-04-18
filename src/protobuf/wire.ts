export type WireType = 0 | 1 | 2 | 5;

export type WireValue =
  | { type: "varint"; field: number; value: bigint | number }
  | { type: "fixed64"; field: number; bytes: Uint8Array }
  | { type: "length"; field: number; bytes: Uint8Array }
  | { type: "fixed32"; field: number; bytes: Uint8Array };

type DecodedValue =
  | { type: "varint"; field: number; wireType: 0; value: bigint | number }
  | { type: "fixed64"; field: number; wireType: 1; bytes: Uint8Array }
  | { type: "length"; field: number; wireType: 2; bytes: Uint8Array }
  | { type: "fixed32"; field: number; wireType: 5; bytes: Uint8Array };

export type DecodedWireValue = DecodedValue;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export function encodeMessage(fields: WireValue[]): Uint8Array {
  return concatBytes(fields.map(encodeField));
}

export function decodeMessage(bytes: Uint8Array): DecodedWireValue[] {
  const fields: DecodedWireValue[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const keyResult = decodeVarint(bytes, offset);
    offset = keyResult.offset;
    const key = Number(keyResult.value);
    const field = key >> 3;
    const wireType = key & 0x07;

    if (field <= 0) {
      throw new Error(`Invalid protobuf field number ${field}`);
    }

    if (wireType === 0) {
      const valueResult = decodeVarint(bytes, offset);
      offset = valueResult.offset;
      fields.push({
        type: "varint",
        field,
        wireType,
        value: toSafeNumber(valueResult.value)
      });
      continue;
    }

    if (wireType === 1) {
      fields.push({
        type: "fixed64",
        field,
        wireType,
        bytes: readExact(bytes, offset, 8)
      });
      offset += 8;
      continue;
    }

    if (wireType === 2) {
      const lengthResult = decodeVarint(bytes, offset);
      offset = lengthResult.offset;
      const length = Number(lengthResult.value);
      fields.push({
        type: "length",
        field,
        wireType,
        bytes: readExact(bytes, offset, length)
      });
      offset += length;
      continue;
    }

    if (wireType === 5) {
      fields.push({
        type: "fixed32",
        field,
        wireType,
        bytes: readExact(bytes, offset, 4)
      });
      offset += 4;
      continue;
    }

    throw new Error(`Unsupported protobuf wire type ${wireType} at offset ${offset}`);
  }

  return fields;
}

export function encodeString(field: number, value: string): WireValue {
  return { type: "length", field, bytes: textEncoder.encode(value) };
}

export function encodeBytes(field: number, bytes: Uint8Array): WireValue {
  return { type: "length", field, bytes };
}

export function encodeMessageField(field: number, children: WireValue[]): WireValue {
  return { type: "length", field, bytes: encodeMessage(children) };
}

export function encodeDouble(field: number, value: number): WireValue {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, true);
  return { type: "fixed64", field, bytes };
}

export function encodeFloat(field: number, value: number): WireValue {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return { type: "fixed32", field, bytes };
}

export function encodeVarintField(field: number, value: number | bigint): WireValue {
  return { type: "varint", field, value };
}

export function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return textDecoder.decode(bytes);
  } catch {
    return null;
  }
}

export function tryDecodeMessage(bytes: Uint8Array): DecodedWireValue[] | null {
  try {
    return decodeMessage(bytes);
  } catch {
    return null;
  }
}

export function fixed64FromDouble(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, true);
  return bytes;
}

export function fixed32FromFloat(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return bytes;
}

export function encodeVarint(value: number | bigint): Uint8Array {
  let current = typeof value === "bigint" ? value : BigInt(value);
  if (current < 0n) {
    throw new Error("Negative varints are not supported");
  }

  const bytes: number[] = [];
  do {
    let byte = Number(current & 0x7fn);
    current >>= 7n;
    if (current !== 0n) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (current !== 0n);

  return Uint8Array.from(bytes);
}

export function decodeVarint(bytes: Uint8Array, startOffset = 0): { value: bigint; offset: number } {
  let value = 0n;
  let shift = 0n;
  let offset = startOffset;

  while (offset < bytes.length) {
    const byte = bytes[offset];
    offset += 1;
    value |= BigInt(byte & 0x7f) << shift;

    if ((byte & 0x80) === 0) {
      return { value, offset };
    }

    shift += 7n;
    if (shift > 63n) {
      throw new Error("Varint is too large");
    }
  }

  throw new Error("Unexpected end of buffer while reading varint");
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function encodeField(field: WireValue): Uint8Array {
  const wireType = wireTypeFor(field);
  const key = encodeVarint((field.field << 3) | wireType);

  if (field.type === "varint") {
    return concatBytes([key, encodeVarint(field.value)]);
  }

  if (field.type === "length") {
    return concatBytes([key, encodeVarint(field.bytes.length), field.bytes]);
  }

  return concatBytes([key, field.bytes]);
}

function wireTypeFor(field: WireValue): WireType {
  if (field.type === "varint") return 0;
  if (field.type === "fixed64") return 1;
  if (field.type === "length") return 2;
  return 5;
}

function readExact(bytes: Uint8Array, offset: number, length: number): Uint8Array {
  if (offset + length > bytes.length) {
    throw new Error(`Unexpected end of buffer while reading ${length} bytes at offset ${offset}`);
  }

  return bytes.slice(offset, offset + length);
}

function toSafeNumber(value: bigint): bigint | number {
  if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }

  return value;
}
