import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, rawHash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !rawHash) {
    return false;
  }

  const expected = Buffer.from(rawHash, "base64url");
  const derived = (await scrypt(password, salt, expected.length)) as Buffer;

  try {
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
