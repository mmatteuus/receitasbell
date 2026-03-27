import { describe, expect, test } from "vitest";
import {
  assertStrongAdminPassword,
  hashAdminPassword,
  verifyAdminPasswordHash,
} from "../src/server/auth/passwords.js";

describe("admin password hardening", () => {
  test("aceita senha forte e valida hash", async () => {
    const password = "ReceitasBell!2026";
    expect(() => assertStrongAdminPassword(password)).not.toThrow();

    const hash = await hashAdminPassword(password);
    await expect(verifyAdminPasswordHash(password, hash)).resolves.toBe(true);
    await expect(verifyAdminPasswordHash("senha_errada", hash)).resolves.toBe(false);
  });

  test("rejeita senha fraca", () => {
    expect(() => assertStrongAdminPassword("12345678")).toThrow("Credencial fraca");
  });
});
