import { beforeEach, describe, expect, test, vi } from "vitest";

const baserowMock = vi.hoisted(() => ({
  fetchBaserow: vi.fn(),
}));

vi.mock("../src/server/integrations/baserow/client.js", () => ({
  fetchBaserow: baserowMock.fetchBaserow,
}));

import { listRecipes } from "../src/server/recipes/repo.js";
import { listCategories } from "../src/server/categories/repo.js";

describe("tenant field compatibility", () => {
  beforeEach(() => {
    baserowMock.fetchBaserow.mockReset();
  });

  test("listRecipes falls back from tenantId to tenant_id and accepts 'publicado' status", async () => {
    baserowMock.fetchBaserow.mockImplementation(async (path: string) => {
      if (path.includes("filter__tenantId__equal")) {
        return { results: [] };
      }
      if (path.includes("filter__tenant_id__equal")) {
        return {
          results: [
            {
              id: 1,
              slug: "bolo-de-cenoura",
              title: "Bolo de cenoura",
              status: "publicado",
              tenant_id: "34",
              category_id: "doces",
            },
          ],
        };
      }
      return { results: [] };
    });

    const recipes = await listRecipes("34");
    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.status).toBe("published");
    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("filter__tenantId__equal=34"),
    );
    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("filter__tenant_id__equal=34"),
    );
  });

  test("listCategories falls back from tenantId to tenant_id", async () => {
    baserowMock.fetchBaserow.mockImplementation(async (path: string) => {
      if (path.includes("filter__tenantId__equal")) {
        return { results: [] };
      }
      if (path.includes("filter__tenant_id__equal")) {
        return {
          results: [
            {
              id: 9,
              slug: "doces",
              name: "Doces",
              tenant_id: "34",
            },
          ],
        };
      }
      return { results: [] };
    });

    const categories = await listCategories("34");
    expect(categories).toHaveLength(1);
    expect(categories[0]?.tenantId).toBe("34");
    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("filter__tenantId__equal=34"),
    );
    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("filter__tenant_id__equal=34"),
    );
  });
});
