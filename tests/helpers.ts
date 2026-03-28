import './playwright-env';
import { expect, type BrowserContext, type Page } from '@playwright/test';

export const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
export const baseOrigin = new URL(baseURL).origin;
export const bootstrapUrl = process.env.PLAYWRIGHT_BOOTSTRAP_URL;
export const adminSecret = process.env.PLAYWRIGHT_ADMIN_SECRET ?? null;
export const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? null;
const envTenantSlug = process.env.PLAYWRIGHT_TENANT_SLUG?.trim();
export const tenantSlug = envTenantSlug ? envTenantSlug : 'receitasbell';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  tenantSlug?: string | null;
};

type RecipeFixtureInput = {
  title: string;
  slug: string;
  description: string;
  accessTier?: 'free' | 'paid';
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

type RouteOptions = {
  tenantSlug?: string | null;
};

function resolveTenantSlug(override?: string | null) {
  if (override !== undefined) {
    const normalized = typeof override === 'string' ? override.trim() : null;
    return normalized || null;
  }

  return tenantSlug;
}

export function createSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaExceeded(status: number, body: unknown) {
  return status >= 500 && JSON.stringify(body).includes('Quota exceeded');
}

export async function loginAdminSession(
  page: Page,
  email = adminEmail,
  password = adminSecret
) {
  if (!email || !password) {
    console.warn('Skipping admin login: PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_SECRET required.');
    return false;
  }

  if (page.url() === 'about:blank') {
    await page.goto(baseURL, { waitUntil: 'load' });
    await page.waitForTimeout(250);
  }

  const response = await appRequest<{ authenticated: boolean }>(page, '/api/admin/auth/session', {
    method: 'POST',
    body: { email, password },
  });

  if (response.status !== 200 || !response.body.authenticated) {
    throw new Error(`Falha ao realizar login admin real: ${JSON.stringify(response.body)}`);
  }

  return true;
}

export async function setIdentityCookie(context: BrowserContext, email: string) {
  await context.addCookies([
    {
      name: 'rb_user_email',
      value: email.toLowerCase(),
      url: baseOrigin,
      sameSite: 'Lax',
    },
  ]);
}

export async function openRoute(page: Page, path: string, options: RouteOptions = {}) {
  let finalPath = path;

  const resolvedTenant = resolveTenantSlug(options.tenantSlug);

  if (resolvedTenant && !path.startsWith('/api') && !path.startsWith('/t/')) {
    if (path === '/') {
      finalPath = `/t/${resolvedTenant}`;
    } else if (path.startsWith('/admin')) {
      finalPath = `/t/${resolvedTenant}${path}`;
    } else {
      finalPath = `/t/${resolvedTenant}${path.startsWith('/') ? path : `/${path}`}`;
    }
  }

  if (bootstrapUrl) {
    await page.goto(bootstrapUrl, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    if (finalPath !== '/') {
      await page.goto(finalPath, { waitUntil: 'load' });
      await page.waitForTimeout(500);
    }
    return;
  }

  await page.goto(finalPath, { waitUntil: 'load' });
  await page.waitForTimeout(500);
}

export async function appRequest<T>(
  page: Page,
  path: string,
  options: RequestOptions = {}
): Promise<{ status: number; body: T }> {
  const resolvedTenant = resolveTenantSlug(options.tenantSlug);
  const response = await page.evaluate(
    async ({ requestPath, method, body, headers, tenant }) => {
      const nextHeaders = new Headers(headers);
      if (body !== undefined) {
        nextHeaders.set('Content-Type', 'application/json');
      }
      if (tenant) {
        nextHeaders.set('X-Tenant-Slug', tenant);
      }

      if (!['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())) {
        const csrfCookieName = '__Host-rb_csrf';
        const existingCookie = document.cookie
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${csrfCookieName}=`));

        let csrfToken = '';
        if (existingCookie) {
          csrfToken = decodeURIComponent(existingCookie.slice(csrfCookieName.length + 1));
        } else {
          const bytes = new Uint8Array(32);
          window.crypto.getRandomValues(bytes);
          csrfToken = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `${csrfCookieName}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax${secure}`;
        }

        nextHeaders.set('X-CSRF-Token', csrfToken);
      }

      const result = await fetch(requestPath, {
        method,
        credentials: 'same-origin',
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
      method: options.method ?? 'GET',
      body: options.body,
      headers: options.headers ?? {},
      tenant: resolvedTenant,
    }
  );

  return response as { status: number; body: T };
}

export async function createRecipeFixture(page: Page, input: RecipeFixtureInput) {
  expect(
    adminSecret,
    'PLAYWRIGHT_ADMIN_SECRET precisa estar definido para criar fixtures.'
  ).toBeTruthy();

  let response = await appRequest<{ recipe: CreatedRecipe; error?: string }>(page, '/api/admin/recipes', {
    method: 'POST',
    body: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      categorySlug: input.categorySlug ?? 'doces',
      accessTier: input.accessTier ?? 'free',
      priceBRL: input.accessTier === 'paid' ? (input.priceBRL ?? 19.9) : undefined,
      imageUrl: '',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      tags: input.tags ?? ['playwright', 'teste'],
      fullIngredients: input.ingredients ?? ['1 xicara de teste', '2 colheres de teste'],
      fullInstructions: input.instructions ?? ['Misture tudo', 'Finalize o preparo'],
      excerpt: input.description,
      seoTitle: input.title,
      seoDescription: input.description,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date().toISOString(),
    },
  });

  if (isQuotaExceeded(response.status, response.body)) {
    await wait(65_000);
    response = await appRequest<{ recipe: CreatedRecipe; error?: string }>(page, '/api/admin/recipes', {
      method: 'POST',
      body: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        categorySlug: input.categorySlug ?? 'doces',
        accessTier: input.accessTier ?? 'free',
        priceBRL: input.accessTier === 'paid' ? (input.priceBRL ?? 19.9) : undefined,
        imageUrl: '',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        tags: input.tags ?? ['playwright', 'teste'],
        fullIngredients: input.ingredients ?? ['1 xicara de teste', '2 colheres de teste'],
        fullInstructions: input.instructions ?? ['Misture tudo', 'Finalize o preparo'],
        excerpt: input.description,
        seoTitle: input.title,
        seoDescription: input.description,
        isFeatured: false,
        status: 'published',
        publishedAt: new Date().toISOString(),
      },
    });
  }

  expect(response.status, JSON.stringify(response.body)).toBe(201);
  return response.body.recipe;
}

export async function waitForRecipeAvailability(page: Page, slug: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await appRequest<{ recipe?: CreatedRecipe; error?: string }>(
      page,
      `/api/public/recipes/${encodeURIComponent(slug)}`
    );

    if (response.status === 200 && response.body.recipe) {
      return;
    }

    await wait(2_000);
  }

  throw new Error(`A receita ${slug} não ficou disponível a tempo para o teste.`);
}

export async function deleteRecipeFixture(page: Page, recipeId: string) {
  if (!adminSecret) {
    return;
  }

  const response = await appRequest<{ error?: string }>(
    page,
    `/api/admin/recipes/${encodeURIComponent(recipeId)}`,
    {
      method: 'DELETE',
    }
  );

  if (isQuotaExceeded(response.status, response.body)) {
    return;
  }

  expect([200, 204, 404], JSON.stringify(response.body)).toContain(response.status);
}
