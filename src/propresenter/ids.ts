import { randomUUID } from "node:crypto";

export function createId(): string {
  return randomUUID().toUpperCase();
}

export function createNumericBuildId(): string {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}
