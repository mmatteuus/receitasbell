import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { persistActiveTenantSlug } from "../src/pwa/app/tenant/pwa-tenant-storage";
import {
  buildTenantAwarePwaPath,
  extractPwaTenantSlugFromPath,
  persistTenantSlugFromPwaPath,
  resolvePwaTenantSlug,
  stripTenantFromPwaPath,
} from "../src/pwa/app/tenant/pwa-tenant-path";

type MockWindow = {
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  location: {
    pathname: string;
  };
};

function createMockWindow(pathname = "/") {
  const storage = new Map<string, string>();

  const mockWindow: MockWindow = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
    },
    location: {
      pathname,
    },
  };

  return { mockWindow, storage };
}

describe("pwa tenant path helpers", () => {
  beforeEach(() => {
    const { mockWindow } = createMockWindow("/pwa/app");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: mockWindow,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  test("extracts tenant slug from tenant-aware pwa path", () => {
    expect(extractPwaTenantSlugFromPath("/t/receitasbell/pwa/app")).toBe("receitasbell");
    expect(extractPwaTenantSlugFromPath("/pwa/app")).toBeNull();
  });

  test("resolves tenant from path and persists from bridge-like routes", () => {
    expect(resolvePwaTenantSlug("/t/minha-loja/pwa/login")).toBe("minha-loja");
    expect(persistTenantSlugFromPwaPath("/t/minha-loja/pwa/entry")).toBe("minha-loja");
    expect(resolvePwaTenantSlug("/pwa/app")).toBe("minha-loja");
  });

  test("falls back to stored tenant for canonical pwa path", () => {
    persistActiveTenantSlug("tenant-salvo");
    expect(resolvePwaTenantSlug("/pwa/app/compras")).toBe("tenant-salvo");
  });

  test("builds and strips tenant-aware pwa paths", () => {
    expect(buildTenantAwarePwaPath("/pwa/app/buscar", "acme")).toBe("/t/acme/pwa/app/buscar");
    expect(buildTenantAwarePwaPath("/t/acme/pwa/app/buscar", null)).toBe("/pwa/app/buscar");
    expect(stripTenantFromPwaPath("/t/acme/pwa/app/receitas/bolo")).toBe("/pwa/app/receitas/bolo");
  });
});
