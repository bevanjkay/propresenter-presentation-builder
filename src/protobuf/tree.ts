import {
  decodeMessage,
  decodeUtf8,
  encodeBytes,
  encodeMessage,
  encodeMessageField,
  type DecodedWireValue,
  type WireValue
} from "./wire.js";

const textEncoder = new TextEncoder();

export type WireNode =
  | { type: "varint"; field: number; value: number | bigint }
  | { type: "fixed64"; field: number; bytes: Uint8Array }
  | { type: "fixed32"; field: number; bytes: Uint8Array }
  | { type: "length"; field: number; bytes: Uint8Array; children?: WireNode[] };

export function decodeTree(bytes: Uint8Array): WireNode[] {
  return decodeMessage(bytes).map(decodedToNode);
}

export function encodeTree(nodes: WireNode[]): Uint8Array {
  return encodeMessage(nodes.map(nodeToWire));
}

export function cloneNode<T extends WireNode>(node: T): T {
  if (node.type === "length") {
    return {
      ...node,
      bytes: node.bytes.slice(),
      children: node.children?.map((child) => cloneNode(child))
    } as T;
  }

  if (node.type === "fixed32" || node.type === "fixed64") {
    return { ...node, bytes: node.bytes.slice() } as T;
  }

  return { ...node };
}

export function nodeToWire(node: WireNode): WireValue {
  if (node.type === "length") {
    if (node.children) {
      return encodeMessageField(node.field, node.children.map(nodeToWire));
    }
    return encodeBytes(node.field, node.bytes);
  }

  if (node.type === "fixed32" || node.type === "fixed64") {
    return { type: node.type, field: node.field, bytes: node.bytes };
  }

  return { type: "varint", field: node.field, value: node.value };
}

export function getString(node: WireNode): string | null {
  if (node.type !== "length" || node.children) {
    return null;
  }

  return decodeUtf8(node.bytes);
}

export function setString(node: WireNode, value: string): void {
  if (node.type !== "length") {
    throw new Error(`Cannot set string on non-length field ${node.field}`);
  }

  node.bytes = textEncoder.encode(value);
  node.children = undefined;
}

export function findStringNodeAtPath(nodes: WireNode[], path: number[]): WireNode | null {
  const node = findNodeAtPath(nodes, path);
  return node && getString(node) !== null ? node : null;
}

export function findNodeAtPath(nodes: WireNode[], path: number[]): WireNode | null {
  let currentNodes = nodes;
  let current: WireNode | undefined;

  for (const [index, field] of path.entries()) {
    current = currentNodes.find((node) => node.field === field);
    if (!current) {
      return null;
    }

    if (index !== path.length - 1) {
      if (current.type !== "length" || !current.children) {
        return null;
      }
      currentNodes = current.children;
    }
  }

  return current ?? null;
}

export function walkNodes(nodes: WireNode[], visitor: (node: WireNode, path: number[]) => void, parentPath: number[] = []): void {
  for (const node of nodes) {
    const path = [...parentPath, node.field];
    visitor(node, path);

    if (node.type === "length" && node.children) {
      walkNodes(node.children, visitor, path);
    }
  }
}

function decodedToNode(field: DecodedWireValue): WireNode {
  if (field.type === "length") {
    const children = decodeChildrenIfStable(field.bytes);
    return children
      ? { type: "length", field: field.field, bytes: field.bytes, children }
      : { type: "length", field: field.field, bytes: field.bytes };
  }

  if (field.type === "fixed32" || field.type === "fixed64") {
    return { type: field.type, field: field.field, bytes: field.bytes };
  }

  return { type: "varint", field: field.field, value: field.value };
}

function decodeChildrenIfStable(bytes: Uint8Array): WireNode[] | undefined {
  let decoded: DecodedWireValue[];
  try {
    decoded = decodeMessage(bytes);
  } catch {
    return undefined;
  }

  if (decoded.length === 0) {
    return undefined;
  }

  const nodes = decoded.map(decodedToNode);
  const reencoded = encodeTree(nodes);
  if (!bytesEqual(bytes, reencoded)) {
    return undefined;
  }

  return nodes;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
