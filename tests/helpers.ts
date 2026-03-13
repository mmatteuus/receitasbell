import "./playwright-env";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://receitasbell.vercel.app";
export const baseOrigin = new URL(baseURL).origin;
export const bootstrapUrl = process.env.PLAYWRIGHT_BOOTSTRAP_URL;
export const adminSecret = process.env.PLAYWRIGHT_ADMIN_SECRET ?? null;

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

type RecipeFixtureInput = {
  title: string;
  slug: string;
  description: string;
  accessTier?: "free" | "paid";
  priceBRL?: number;
  categorySlug?: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
};

export type CreatedRecipe = {
  id: string;
  slug: string;
  title: string;
};

export function createSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function primeSession(
  page: Page,
  options: { identityEmail?: string; adminSecret?: string | null } = {},
) {
  if (options.identityEmail) {
    await setIdentityCookie(page.context(), options.identityEmail);
  }

  if (options.adminSecret) {
    await page.addInitScript((secret: string) => {
      window.sessionStorage.setItem("rb_admin_secret", secret);
    }, options.adminSecret);
  }
}

export async function setIdentityCookie(context: BrowserContext, email: string) {
  await context.addCookies([
    {
      name: "rb_user_email",
      value: email.toLowerCase(),
      url: baseOrigin,
      path: "/",
      sameSite: "Lax",
    },
  ]);
}

export async function openRoute(page: Page, path: string) {
  if (bootstrapUrl) {
    await page.goto(bootstrapUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    if (path !== "/") {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
    }

    return;
  }

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

export async function appRequest<T>(
  page: Page,
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; body: T }> {
  const response = await page.evaluate(
    async ({ requestPath, method, body, headers }) => {
      const nextHeaders = new Headers(headers);
      if (body !== undefined) {
        nextHeaders.set("Content-Type", "application/json");
      }

      const result = await fetch(requestPath, {
        method,
        credentials: "same-origin",
        headers: nextHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const text = await result.text();
      let payload: unknown = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      return {
        status: result.status,
        body: payload,
      };
    },
    {
      requestPath: path,
      method: options.method ?? "GET",
      body: options.body,
      headers: options.headers ?? {},
    },
  );

  return response as { status: number; body: T };
}

export async function createRecipeFixture(page: Page, input: RecipeFixtureInput) {
  expect(adminSecret, "PLAYWRIGHT_ADMIN_SECRET precisa estar definido para criar fixtures.").toBeTruthy();

  const response = await appRequest<{ recipe: CreatedRecipe; error?: string }>(page, "/api/recipes", {
    method: "POST",
    headers: {
      "x-admin-secret": adminSecret!,
    },
    body: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      categorySlug: input.categorySlug ?? "doces",
      accessTier: input.accessTier ?? "free",
      priceBRL: input.accessTier === "paid" ? input.priceBRL ?? 19.9 : undefined,
      imageUrl: "",
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      tags: input.tags ?? ["playwright", "teste"],
      fullIngredients: input.ingredients ?? ["1 xicara de teste", "2 colheres de teste"],
      fullInstructions: input.instructions ?? ["Misture tudo", "Finalize o preparo"],
      excerpt: input.description,
      seoTitle: input.title,
      seoDescription: input.description,
      isFeatured: false,
      status: "published",
      publishedAt: new Date().toISOString(),
    },
  });

  expect(response.status, JSON.stringify(response.body)).toBe(201);
  return response.body.recipe;
}

export async function deleteRecipeFixture(page: Page, recipeId: string) {
  if (!adminSecret) {
    return;
  }

  const response = await appRequest<{ error?: string }>(page, `/api/recipes/${encodeURIComponent(recipeId)}`, {
    method: "DELETE",
    headers: {
      "x-admin-secret": adminSecret,
    },
  });

  expect([200, 204, 404], JSON.stringify(response.body)).toContain(response.status);
}
