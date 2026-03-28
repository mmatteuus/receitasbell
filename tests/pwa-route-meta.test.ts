import { describe, expect, test } from "vitest";
import { resolvePwaRouteMeta } from "../src/pwa/app/shell/pwa-route-meta";

describe("pwa route meta", () => {
  test("marks root tabs as root and sets expected title", () => {
    const home = resolvePwaRouteMeta("/pwa/app");
    const favorites = resolvePwaRouteMeta("/pwa/app/favoritos");

    expect(home.title).toBe("Receitas Bell");
    expect(home.isRoot).toBe(true);
    expect(favorites.title).toBe("Favoritos");
    expect(favorites.isRoot).toBe(true);
  });

  test("handles tenant path and dynamic recipe route", () => {
    const meta = resolvePwaRouteMeta("/t/minha-loja/pwa/app/receitas/bolo-de-cenoura");

    expect(meta.normalizedPathname).toBe("/pwa/app/receitas/bolo-de-cenoura");
    expect(meta.title).toBe("Receita");
    expect(meta.isRoot).toBe(false);
  });
});
