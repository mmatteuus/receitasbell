import { describe, expect, test } from "vitest";
import type { VercelRequest } from "@vercel/node";
import { CSRF_COOKIE, requireCsrf, requireSameOriginIfPresent } from "../src/server/security/csrf.js";

describe("csrf guards", () => {
  test("requireCsrf aceita header e cookie iguais", () => {
    expect(() =>
      requireCsrf({
        headers: {
          cookie: `${CSRF_COOKIE}=abc123`,
          "x-csrf-token": "abc123",
        },
      } as unknown as VercelRequest),
    ).not.toThrow();
  });

  test("requireCsrf rejeita quando token nao confere", () => {
    expect(() =>
      requireCsrf({
        headers: {
          cookie: `${CSRF_COOKIE}=abc123`,
          "x-csrf-token": "xyz",
        },
      } as unknown as VercelRequest),
    ).toThrow("CSRF validation failed");
  });

  test("requireSameOriginIfPresent valida origin quando presente", () => {
    expect(() =>
      requireSameOriginIfPresent({
        headers: {
          origin: "https://receitasbell.com",
          host: "receitasbell.com",
          "x-forwarded-proto": "https",
        },
      } as unknown as VercelRequest),
    ).not.toThrow();
  });

  test("requireSameOriginIfPresent rejeita origin divergente", () => {
    expect(() =>
      requireSameOriginIfPresent({
        headers: {
          origin: "https://evil.example",
          host: "receitasbell.com",
          "x-forwarded-proto": "https",
        },
      } as unknown as VercelRequest),
    ).toThrow("Origin validation failed");
  });
});
