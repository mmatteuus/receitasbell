import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  clearPwaRedirect,
  readPwaRedirect,
  savePwaRedirect,
} from "../src/pwa/app/auth/pwa-auth-redirect";

type MockWindow = {
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

function createMockWindow() {
  const storage = new Map<string, string>();

  const mockWindow: MockWindow = {
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
    },
  };

  return { mockWindow, storage };
}

describe("pwa auth redirect storage", () => {
  beforeEach(() => {
    const { mockWindow } = createMockWindow();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: mockWindow,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  test("saves and reads redirect path", () => {
    savePwaRedirect("/pwa/app/receitas/lasanha");
    expect(readPwaRedirect()).toBe("/pwa/app/receitas/lasanha");
  });

  test("clears redirect path", () => {
    savePwaRedirect("/pwa/app/favoritos");
    clearPwaRedirect();
    expect(readPwaRedirect()).toBeNull();
  });

  test("is a no-op when window is not available", () => {
    Reflect.deleteProperty(globalThis, "window");

    expect(() => savePwaRedirect("/pwa/app")).not.toThrow();
    expect(() => clearPwaRedirect()).not.toThrow();
    expect(readPwaRedirect()).toBeNull();
  });
});
