import { describe, expect, test } from "vitest";
import { buildPwaAdminPath, buildPwaPath } from "../src/pwa/app/navigation/pwa-paths";

describe("pwa path builders", () => {
  test("builds user routes in canonical /pwa namespace", () => {
    expect(buildPwaPath("home")).toBe("/pwa/app");
    expect(buildPwaPath("search")).toBe("/pwa/app/buscar");
    expect(buildPwaPath("recipe", { slug: "bolo-de-cenoura" })).toBe(
      "/pwa/app/receitas/bolo-de-cenoura",
    );
  });

  test("builds tenant-aware user routes", () => {
    expect(buildPwaPath("entry", { tenantSlug: "minha-loja" })).toBe("/t/minha-loja/pwa/entry");
    expect(buildPwaPath("login", { tenantSlug: "minha-loja" })).toBe("/t/minha-loja/pwa/login");
    expect(buildPwaPath("home", { tenantSlug: "minha-loja" })).toBe("/t/minha-loja/pwa/app");
  });

  test("builds admin routes with optional nested path", () => {
    expect(buildPwaAdminPath()).toBe("/pwa/admin");
    expect(buildPwaAdminPath({ tenantSlug: "minha-loja" })).toBe("/t/minha-loja/pwa/admin");
    expect(buildPwaAdminPath({ tenantSlug: "minha-loja", path: "receitas" })).toBe(
      "/t/minha-loja/pwa/admin/receitas",
    );
  });
});
