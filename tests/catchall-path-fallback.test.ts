import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const publicCatalogMock = vi.hoisted(() => vi.fn(async (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ ok: "catalog" });
}));

const healthLiveMock = vi.hoisted(() => vi.fn(async (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ ok: "live" });
}));

const authMeMock = vi.hoisted(() => vi.fn(async (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ ok: "me" });
}));

vi.mock("../api_handlers/public/catalog.js", () => ({ default: publicCatalogMock }));
vi.mock("../api_handlers/public/categories.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/public/comments.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/public/newsletter.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/public/ratings.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/public/recipes/[slug].js", () => ({ default: vi.fn() }));

vi.mock("../api_handlers/health/live.js", () => ({ default: healthLiveMock }));
vi.mock("../api_handlers/health/ready.js", () => ({ default: vi.fn() }));

vi.mock("../api_handlers/auth/logout.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/auth/me.js", () => ({ default: authMeMock }));
vi.mock("../api_handlers/auth/request-magic-link.js", () => ({ default: vi.fn() }));
vi.mock("../api_handlers/auth/verify-magic-link.js", () => ({ default: vi.fn() }));

import publicHandler from "../api/public/[...path]";
import healthHandler from "../api/health/[...path]";
import authHandler from "../api/auth/[...path]";

function buildRes() {
  const state: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
    _state: state,
  };
  return res as unknown as VercelResponse & { _state: typeof state };
}

describe("api catch-all route fallback", () => {
  beforeEach(() => {
    publicCatalogMock.mockClear();
    healthLiveMock.mockClear();
    authMeMock.mockClear();
  });

  test("resolve rota public por request.url quando query.path está vazio", async () => {
    const res = buildRes();
    await publicHandler(
      { method: "GET", url: "/api/public/catalog", query: {}, headers: {} } as unknown as VercelRequest,
      res,
    );
    expect(publicCatalogMock).toHaveBeenCalledOnce();
    expect(res._state.status).toBe(200);
  });

  test("resolve rota health por request.url quando query.path está vazio", async () => {
    const res = buildRes();
    await healthHandler(
      { method: "GET", url: "/api/health/live", query: {}, headers: {} } as unknown as VercelRequest,
      res,
    );
    expect(healthLiveMock).toHaveBeenCalledOnce();
    expect(res._state.status).toBe(200);
  });

  test("mantém suporte ao query.path para rota auth", async () => {
    const res = buildRes();
    await authHandler(
      { method: "GET", url: "/api/auth/me", query: { path: ["me"] }, headers: {} } as unknown as VercelRequest,
      res,
    );
    expect(authMeMock).toHaveBeenCalledOnce();
    expect(res._state.status).toBe(200);
  });
});
