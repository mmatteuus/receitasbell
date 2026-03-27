import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("vercel.json hardening headers", () => {
  test("contains required security headers rollout", () => {
    const raw = readFileSync("vercel.json", "utf8");
    const parsed = JSON.parse(raw) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    const allHeaders = (parsed.headers || []).flatMap((entry) => entry.headers || []);
    const keys = new Set(allHeaders.map((entry) => entry.key));

    expect(keys.has("Strict-Transport-Security")).toBe(true);
    expect(keys.has("Content-Security-Policy-Report-Only")).toBe(true);
    expect(keys.has("X-Frame-Options")).toBe(true);
    expect(keys.has("Permissions-Policy")).toBe(true);
  });

  test("enforces the production gate and single checkout route", () => {
    const raw = readFileSync("vercel.json", "utf8");
    const parsed = JSON.parse(raw) as {
      buildCommand?: string;
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(parsed.buildCommand).toBe("npm run gate");

    const rewriteSources = new Set((parsed.rewrites || []).map((entry) => entry.source));
    expect(rewriteSources.has("/api/checkout")).toBe(true);
    expect(rewriteSources.has("/api/payments/mercadopago/create-preference")).toBe(false);
    expect(rewriteSources.has("/api/payments/mercadopago/webhook")).toBe(false);
  });
});
