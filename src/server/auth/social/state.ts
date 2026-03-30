import crypto from "node:crypto";

export const SOCIAL_STATE_TTL_MS = 10 * 60 * 1000;

export function createOpaqueState() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashOpaqueState(state: string) {
  return crypto.createHash("sha256").update(state).digest("hex");
}
