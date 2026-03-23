import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createOpaqueState(size = 32) {
  return randomBytes(size).toString("base64url");
}

export function hashOpaqueState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export function stateMatches(hash: string, value: string) {
  const expected = Buffer.from(hash, "hex");
  const received = Buffer.from(hashOpaqueState(value), "hex");
  try { return timingSafeEqual(expected, received); } catch { return false; }
}
