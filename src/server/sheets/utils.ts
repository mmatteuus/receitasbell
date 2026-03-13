import { generateSlug } from "../../lib/helpers.js";

export function asString(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function asNullableString(value: string | undefined) {
  return value && value.trim() ? value : null;
}

export function asNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asBoolean(value: string | undefined, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

export function asJson<T>(value: string | undefined, fallback: T) {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJsonString(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function nowIso() {
  return new Date().toISOString();
}

export function createUniqueSlug(baseValue: string, existingValues: string[], excludeValue?: string) {
  const base = generateSlug(baseValue) || "item";
  let slug = base;
  let suffix = 2;

  while (existingValues.some((value) => value === slug && value !== excludeValue)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function isBlankRecord(record: Record<string, string>) {
  return Object.values(record).every((value) => !value.trim());
}
