import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ApiError } from "../shared/http.js";

const HASH_ALGO = "scrypt";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const MIN_ADMIN_PASSWORD_LENGTH = 10;

const COMMON_WEAK_PASSWORDS = new Set([
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "admin",
  "admin123",
  "qwerty",
  "qwerty123",
  "abc123",
  "letmein",
]);

export function getAdminPasswordStrengthIssues(password: string) {
  const value = String(password || "");
  const issues: string[] = [];

  if (value.length < MIN_ADMIN_PASSWORD_LENGTH) {
    issues.push(`A senha deve ter no mínimo ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (/\s/.test(value)) {
    issues.push("A senha não pode conter espaços.");
  }

  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  if (classes < 3) {
    issues.push("A senha deve combinar pelo menos 3 tipos: minúsculas, maiúsculas, números e símbolos.");
  }
  if (/(.)\1{3,}/.test(value)) {
    issues.push("A senha não pode ter repetições longas do mesmo caractere.");
  }
  if (COMMON_WEAK_PASSWORDS.has(value.toLowerCase())) {
    issues.push("A senha informada está na lista de credenciais fracas.");
  }

  return issues;
}

export function assertStrongAdminPassword(password: string, fieldLabel = "password") {
  const issues = getAdminPasswordStrengthIssues(password);
  if (issues.length > 0) {
    throw new ApiError(400, `Credencial fraca para ${fieldLabel}.`, { issues });
  }
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }) as Buffer;

  return [
    HASH_ALGO,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyAdminPasswordHash(password: string, storedHash: string) {
  try {
    if (!storedHash || typeof storedHash !== "string") return false;

    const parts = storedHash.split("$");
    if (parts.length !== 6) return false;
    const [algo, nRaw, rRaw, pRaw, saltRaw, digestRaw] = parts;
    if (algo !== HASH_ALGO) return false;

    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

    const salt = Buffer.from(saltRaw, "base64url");
    const expected = Buffer.from(digestRaw, "base64url");
    const computed = scryptSync(password, salt, expected.length, { N, r, p }) as Buffer;

    if (expected.length !== computed.length) return false;
    return timingSafeEqual(expected, computed);
  } catch {
    return false;
  }
}
