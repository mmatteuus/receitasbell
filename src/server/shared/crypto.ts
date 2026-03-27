import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function readEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("ENCRYPTION_KEY is required.");

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be base64 for a 32-byte key.");
  return key;
}

export function encryptSecret(value: string) {
  if (!value) return "";
  const key = readEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return "";
  const [ivRaw, tagRaw, payloadRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !payloadRaw) throw new Error("Encrypted secret has an invalid format.");

  const key = readEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(payloadRaw, "base64url")), decipher.final()]);
  return decrypted.toString("utf8");
}
