import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  clearStoredPwaTenantSlug,
  getCurrentTenantSlug,
  rememberTenantSlugFromPath,
  setActiveTenantSlug,
} from "../src/lib/tenant";

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

describe("pwa tenant storage", () => {
  beforeEach(() => {
    const { mockWindow } = createMockWindow();
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    clearStoredPwaTenantSlug();
    Reflect.deleteProperty(globalThis, "window");
  });

  test("usa o tenant salvo quando o runtime esta em /pwa", () => {
    setActiveTenantSlug("tenant-pwa");
    window.location.pathname = "/pwa/app/conta";

    expect(getCurrentTenantSlug()).toBe("tenant-pwa");
  });

  test("prioriza o tenant explicito na rota tenant-aware", () => {
    setActiveTenantSlug("tenant-antigo");

    expect(getCurrentTenantSlug("/t/tenant-novo/pwa/login")).toBe("tenant-novo");
  });

  test("persiste o tenant ao passar por bootstrap alias", () => {
    const tenantSlug = rememberTenantSlugFromPath("/t/minha-loja/pwa/entry");

    expect(tenantSlug).toBe("minha-loja");
    expect(getCurrentTenantSlug("/pwa/app")).toBe("minha-loja");
  });
});
