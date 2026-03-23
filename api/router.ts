import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from '../src/lib/defaults.js';
import {
  getAdminApiSecret,
  getMercadoPagoAppEnvAsync,
  getRequiredEnv,
  hasMercadoPagoAppConfigAsync,
  hasMercadoPagoConfig,
  hasMercadoPagoWebhookSecretAsync,
} from '../src/server/env.js';
import { resolveOptionalIdentityUser, requireIdentityUser } from '../src/server/identity.js';
import {
  ApiError,
  assertMethod,
  clearAdminSessionCookie,
  getAppBaseUrl,
  getIdentityEmail,
  hasAdminAccess,
  parseStringArray,
  readJsonBody,
  requireAdminAccess,
  requireQueryParam,
  setAdminSessionCookie,
  sendJson,
  sendNoContent,
  withApiHandler,
} from '../src/server/http.js';
import { consumeAdminRateLimit } from '../src/server/rateLimit.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../src/server/baserow/categoriesRepo.js';
import { listEntitlementsByEmail } from '../src/server/baserow/entitlementsRepo.js';
import { createComment, listCommentsByRecipeId } from '../src/server/baserow/commentsRepo.js';
import {
  createFavorite,
  deleteFavorite,
  listFavoritesByUserId,
} from '../src/server/baserow/favoritesRepo.js';
import { subscribeToNewsletter } from '../src/server/baserow/newsletterRepo.js';
import {
  getPaymentById,
  listPayments,
  addPaymentNote,
} from '../src/server/baserow/paymentsRepo.js';
import {
  createRecipe,
  deleteRecipe,
  getRecipeById as getBaserowRecipeById,
  getRecipeBySlug as getBaserowRecipeBySlug,
  listRecipes,
  updateRecipe,
} from '../src/server/baserow/recipesRepo.js';
import {
  getSettingsMap,
  mapTypedSettings,
  saveSettings,
} from '../src/server/baserow/settingsRepo.js';
import {
  deleteShoppingListItem,
  listShoppingListItems,
  updateShoppingListItem,
  createShoppingListItems,
} from '../src/server/baserow/shoppingListRepo.js';
import { findOrCreateUserByEmail } from '../src/server/baserow/usersRepo.js';
import { upsertRating } from '../src/server/baserow/ratingsRepo.js';
import { requireTenantFromRequest } from '../src/server/tenants/resolver.js';
import { 
  createMercadoPagoCheckout, 
  createMockCheckout, 
  syncMercadoPagoPayment 
} from '../src/server/baserow/checkoutRepo.js';

import {
  categorySchema,
  checkoutCreateSchema,
  checkoutSchema,
  commentSchema,
  favoriteSchema,
  newsletterSchema,
  noteSchema,
  ratingSchema,
  recipeMutationSchema,
  settingsSchema,
  shoppingListCreateSchema,
  shoppingListUpdateSchema,
} from '../src/server/validators.js';
import { assertMercadoPagoWebhookSignature } from '../src/server/payments/mercadoPago.js';
import { processIdempotentWebhook } from '../src/server/payments/webhookService.js';
import { createMagicLinkToken, verifyMagicLinkToken } from '../src/server/auth/magicLink.js';
import { signSession, setSessionCookie, clearSessionCookie } from '../src/server/auth/sessions.js';
import { sendMagicLinkEmail } from '../src/server/integrations/email.ts';
import { logAuditEntry, logAdminAction } from '../src/server/logging/audit.ts';
import { runReconciliationJob } from '../src/server/jobs/reconcile.ts';
import { runCleanupJob, runConsistencyJob } from '../src/server/jobs/maintenance.ts';
import type { Category } from '../src/types/category.js';
import type { SettingsMap } from '../src/types/settings.js';

const fallbackPublicSettings: SettingsMap = {
  ...DEFAULT_SITE_SETTINGS,
  ...DEFAULT_HOME_SETTINGS,
  ...DEFAULT_PAYMENT_SETTINGS,
};

function sortCategories(categories: Category[]) {
  return [...categories].sort((left, right) => left.name.localeCompare(right.name));
}

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || !error) return NaN;
  if ('code' in error) return Number((error as any).code);
  if ('status' in error) return Number((error as any).status);
  return NaN;
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function handleMercadoPagoCallback(request: VercelRequest) {
  const code = getQueryValue(request.query.code as any);
  const state = getQueryValue(request.query.state as any);
  if (!code || !state) throw new ApiError(400, 'Missing code or state');

  const { handleMercadoPagoOAuthCallback } = await import('../src/server/mercadopago/oauth.js');
  const { tenantId, returnTo } = await handleMercadoPagoOAuthCallback(code, state);
  return { tenantId, returnTo };
}

function getApiPathSegments(request: VercelRequest) {
  const routedPath = getQueryValue(request.query.route as string | string[] | undefined);
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const rawPath = routedPath || url.pathname.replace(/^\/api\/router\/?/, '').replace(/^\/api\/?/, '');
  return rawPath.split('/').map(s => s.trim()).filter(Boolean).map(decodeURIComponent);
}

function getClientAddress(request: VercelRequest) {
  const forwarded = request.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.socket.remoteAddress || 'unknown';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return null;
}

function extractMercadoPagoPaymentId(request: VercelRequest, payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  const queryId = getQueryValue(request.query.id as string | string[] | undefined) || getQueryValue(request.query['data.id'] as string | string[] | undefined);
  const directId = asText(data?.id) || asText(payload.id) || asText(queryId);
  if (directId) return directId;
  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

// fetchMercadoPagoPayment moved to shared payments module

async function createCheckoutResponse(request: VercelRequest, body: any) {
  const { tenant } = await requireTenantFromRequest(request);
  const settings = mapTypedSettings(await getSettingsMap(tenant.id));
  const validated = checkoutCreateSchema.parse(body);
  
  const checkoutInput = {
    recipeIds: validated.recipeIds,
    buyerEmail: validated.buyerEmail.toLowerCase(),
    checkoutReference: validated.checkoutReference || crypto.randomUUID(),
    baseUrl: getAppBaseUrl(request),
  };

  if (settings.payment_mode === 'production' && settings.mp_access_token) {
    return createMercadoPagoCheckout(String(tenant.id), checkoutInput);
  }
  return createMockCheckout(String(tenant.id), checkoutInput);
}

async function processMercadoPagoWebhook(request: VercelRequest) {
  const { tenant } = await requireTenantFromRequest(request);
  const payload = await readJsonBody<Record<string, unknown>>(request);
  const paymentId = extractMercadoPagoPaymentId(request, payload);
  if (!paymentId) return { received: true, ignored: true };

  assertMercadoPagoWebhookSignature(request, paymentId);
  return processIdempotentWebhook(String(tenant.id), paymentId, payload);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const segments = getApiPathSegments(request);
    const [resource, resourceId, action, subaction] = segments;

    if (!resource) throw new ApiError(404, 'API route not found');

    // OAuth Callback
    if (resource === 'mercadopago' && resourceId === 'oauth' && action === 'callback') {
      const { returnTo } = await handleMercadoPagoCallback(request);
      return response.redirect(302, returnTo || '/');
    }

    // Admin Session
    if (resource === 'admin' && resourceId === 'session') {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') return sendJson(response, 200, { authenticated: hasAdminAccess(request) });
      if (request.method === 'DELETE') { clearAdminSessionCookie(request, response); return sendNoContent(response); }
      assertMethod(request, ['POST']);
      const body = await readJsonBody<{ password?: string }>(request);
      const password = String(body.password || '');
      const clientAddress = getClientAddress(request);
      const rateResult = await consumeAdminRateLimit(clientAddress);
      if (!rateResult.success) { response.setHeader('Retry-After', String(rateResult.resetAfter)); throw new ApiError(429, 'Too many attempts'); }
      if (password !== getAdminApiSecret()) throw new ApiError(401, 'Invalid password');
      setAdminSessionCookie(request, response, password);
      await logAuditEntry(tenant.id, { action: 'admin_login', resourceType: 'admin', userId: 'admin' });
      return sendJson(response, 200, { authenticated: true });
    }

    // Auth Routes
    if (resource === 'auth') {
      if (resourceId === 'request-magic-link') {
        assertMethod(request, ['POST']);
        const { tenant } = await requireTenantFromRequest(request);
        const { email } = await readJsonBody<{ email: string }>(request);
        if (!email) throw new ApiError(400, "Email is required");
        
        const token = await createMagicLinkToken(tenant.id, email);
        const baseUrl = getAppBaseUrl(request);
        const magicLinkUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}&tenantId=${tenant.id}`;
        
        await sendMagicLinkEmail(email, magicLinkUrl);
        return sendJson(response, 200, { sent: true });
      }

      if (resourceId === 'verify-magic-link') {
        assertMethod(request, ['GET']);
        const token = requireQueryParam(request, 'token');
        const tenantId = requireQueryParam(request, 'tenantId');
        
        const record = await verifyMagicLinkToken(tenantId, token);
        if (!record) throw new ApiError(401, "Invalid or expired token");
        
        const user = await findOrCreateUserByEmail(tenantId, record.email || "");
        const sessionToken = signSession({
            userId: String(user.id),
            email: user.email,
            tenantId: String(tenantId),
            role: "user",
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        });

        setSessionCookie(response, sessionToken);
        return response.redirect('/'); // Redireciona para home após login
      }

      if (resourceId === 'me') {
        const identity = await resolveOptionalIdentityUser(request);
        return sendJson(response, 200, { 
            authenticated: !!identity.email,
            user: identity.user 
        });
      }

      if (resourceId === 'logout') {
        clearSessionCookie(response);
        return sendJson(response, 200, { success: true });
      }
    }

    // Admin Mercado Pago Connection
    if (resource === 'admin' && resourceId === 'mercadopago') {
      requireAdminAccess(request);
      const { tenant } = await requireTenantFromRequest(request);

      if (action === 'connect') {
        assertMethod(request, ['POST']);
        const body = await readJsonBody<{ returnTo?: string }>(request);
        const { getMercadoPagoConnectUrl } = await import('../src/server/mercadopago/oauth.js');
        const authorizationUrl = await getMercadoPagoConnectUrl(tenant.id, {
          returnTo: body.returnTo || getAppBaseUrl(request),
        });
        return sendJson(response, 201, { authorizationUrl });
      }

      if (action === 'disconnect') {
        assertMethod(request, ['POST']);
        const { disconnectTenantMercadoPagoConnection } = await import('../src/server/mercadopago/connections.js');
        await disconnectTenantMercadoPagoConnection({ tenantId: String(tenant.id) });
        return sendJson(response, 200, { disconnected: true, connectionStatus: 'disconnected' });
      }
    }

    // Recipes
    if (resource === 'recipes' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') {
        const recipes = await listRecipes(String(tenant.id), {
          categorySlug: getQueryValue(request.query.categorySlug as any),
          q: getQueryValue(request.query.q as any),
          includeDrafts: hasAdminAccess(request),
        });
        return sendJson(response, 200, { recipes });
      }
      assertMethod(request, ['POST']);
      requireAdminAccess(request);
      const body = recipeMutationSchema.parse(await readJsonBody(request));
      const recipe = await createRecipe(String(tenant.id), body);
      await logAdminAction(tenant.id, 'admin', 'create_recipe', 'recipe', String(recipe.id));
      return sendJson(response, 201, { recipe });
    }

    if (resource === 'recipes' && resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') {
        const lookupBy = getQueryValue(request.query.by as any);
        const recipe = lookupBy === 'id' ? await getBaserowRecipeById(String(tenant.id), resourceId) : await getBaserowRecipeBySlug(String(tenant.id), resourceId);
        if (!recipe) throw new ApiError(404, 'Recipe not found');
        return sendJson(response, 200, { recipe });
      }
      if (request.method === 'PUT') {
        requireAdminAccess(request);
        const body = recipeMutationSchema.parse(await readJsonBody(request));
        const recipe = await updateRecipe(String(tenant.id), resourceId, body);
        await logAdminAction(tenant.id, 'admin', 'update_recipe', 'recipe', resourceId);
        return sendJson(response, 200, { recipe });
      }
      assertMethod(request, ['DELETE']);
      requireAdminAccess(request);
      await deleteRecipe(String(tenant.id), resourceId);
      await logAdminAction(tenant.id, 'admin', 'delete_recipe', 'recipe', resourceId);
      return sendNoContent(response);
    }

    // Categories
    if (resource === 'categories' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') return sendJson(response, 200, { categories: await listCategories(String(tenant.id)) });
      requireAdminAccess(request);
      const body = categorySchema.parse(await readJsonBody(request));
      const category = await createCategory(String(tenant.id), { ...body, slug: body.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') });
      return sendJson(response, 201, { category });
    }

    if (resource === 'categories' && resourceId) {
        const { tenant } = await requireTenantFromRequest(request);
        if (request.method === 'PUT') {
            requireAdminAccess(request);
            const body = categorySchema.parse(await readJsonBody(request));
            const category = await updateCategory(String(tenant.id), resourceId, body);
            return sendJson(response, 200, { category });
        }
        assertMethod(request, ['DELETE']);
        requireAdminAccess(request);
        await deleteCategory(String(tenant.id), resourceId);
        return sendNoContent(response);
    }

    // Comments
    if (resource === 'comments' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') {
        const recipeId = requireQueryParam(request, 'recipeId');
        return sendJson(response, 200, { comments: await listCommentsByRecipeId(String(tenant.id), recipeId) });
      }
      assertMethod(request, ['POST']);
      const body = commentSchema.parse(await readJsonBody(request));
      const identity = await requireIdentityUser(request, body.authorName);
      const comment = await createComment(String(tenant.id), {
        recipeId: String(body.recipeId),
        authorName: body.authorName,
        authorEmail: identity.email,
        userId: String(identity.user?.id || ''),
        text: body.text,
      });
      return sendJson(response, 201, { comment });
    }

    // Ratings
    if (resource === 'ratings' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = ratingSchema.parse(await readJsonBody(request));
      const { tenant } = await requireTenantFromRequest(request);
      const identity = await resolveOptionalIdentityUser(request);
      const summary = await upsertRating(String(tenant.id), {
        recipeId: body.recipeId,
        value: body.value,
        userId: identity.user?.id ? String(identity.user.id) : undefined,
        authorEmail: identity.email || '',
      });
      return sendJson(response, 200, summary);
    }

    // Favorites
    if (resource === 'favorites' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      const identity = await requireIdentityUser(request);
      if (request.method === 'GET') return sendJson(response, 200, { favorites: await listFavoritesByUserId(String(tenant.id), String(identity.user!.id)) });
      assertMethod(request, ['POST']);
      const body = favoriteSchema.parse(await readJsonBody(request));
      const favorite = await createFavorite(String(tenant.id), String(identity.user!.id), String(body.recipeId));
      return sendJson(response, 201, { favorite });
    }

    if (resource === 'favorites' && resourceId) {
      assertMethod(request, ['DELETE']);
      const { tenant } = await requireTenantFromRequest(request);
      const identity = await requireIdentityUser(request);
      await deleteFavorite(String(tenant.id), String(identity.user!.id), resourceId);
      return sendNoContent(response);
    }

    // Shopping List
    if (resource === 'shopping-list' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      const identity = await requireIdentityUser(request);
      if (request.method === 'GET') return sendJson(response, 200, { items: await listShoppingListItems(String(tenant.id), String(identity.user!.id)) });
      assertMethod(request, ['POST']);
      const body = shoppingListCreateSchema.parse(await readJsonBody(request));
      const items = await createShoppingListItems(String(tenant.id), String(identity.user!.id), body.items);
      return sendJson(response, 201, { items });
    }

    if (resource === 'shopping-list' && resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      const identity = await requireIdentityUser(request);
      if (request.method === 'PUT') {
        const body = shoppingListUpdateSchema.parse(await readJsonBody(request));
        const item = await updateShoppingListItem(String(tenant.id), String(identity.user!.id), resourceId, body);
        return sendJson(response, 200, { item });
      }
      assertMethod(request, ['DELETE']);
      await deleteShoppingListItem(String(tenant.id), String(identity.user!.id), resourceId);
      return sendNoContent(response);
    }

    // Settings
    if (resource === 'settings' && !resourceId) {
      const { tenant } = await requireTenantFromRequest(request);
      if (request.method === 'GET') return sendJson(response, 200, { settings: await getSettingsMap(String(tenant.id)) });
      requireAdminAccess(request);
      const body = settingsSchema.parse(await readJsonBody(request));
      const settings = await saveSettings(String(tenant.id), body.settings as any);
      await logAdminAction(tenant.id, 'admin', 'update_settings', 'settings', 'global');
      return sendJson(response, 200, { settings });
    }

    // Payments & Checkout
    if (resource === 'admin' && resourceId === 'payments') {
        requireAdminAccess(request);
        const { tenant } = await requireTenantFromRequest(request);
        if (request.method === 'GET' && !action) return sendJson(response, 200, { payments: await listPayments(String(tenant.id)) });
        if (request.method === 'GET' && action === 'settings') {
            const settings = mapTypedSettings(await getSettingsMap(String(tenant.id)));
            return sendJson(response, 200, { settings: { ...settings, mp_access_token: '***', mp_refresh_token: '***' } });
        }
        if (request.method === 'GET' && action) {
            const details = await getPaymentById(String(tenant.id), action);
            if (!details) throw new ApiError(404, 'Payment not found');
            return sendJson(response, 200, details);
        }
    }

    if (resource === 'payments' && resourceId === 'mercadopago' && action === 'webhook') {
      assertMethod(request, ['POST']);
      return sendJson(response, 202, await processMercadoPagoWebhook(request));
    }

    if (resource === 'payments' && resourceId && action === 'note') {
      assertMethod(request, ['POST']);
      requireAdminAccess(request);
      const { tenant } = await requireTenantFromRequest(request);
      const body = noteSchema.parse(await readJsonBody(request));
      const note = await addPaymentNote(String(tenant.id), resourceId, body.note);
      return sendJson(response, 201, { note });
    }

    if (resource === 'checkout' && !resourceId) {
      assertMethod(request, ['POST']);
      return sendJson(response, 201, await createCheckoutResponse(request, await readJsonBody(request)));
    }

    if (resource === 'newsletter' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = newsletterSchema.parse(await readJsonBody(request));
      const { tenant } = await requireTenantFromRequest(request);
      return sendJson(response, 201, { subscriber: await subscribeToNewsletter(String(tenant.id), body.email) });
    }

    // Jobs
    if (resource === 'jobs') {
      const secret = requireQueryParam(request, 'secret');
      if (secret !== getRequiredEnv('CRON_SECRET')) throw new ApiError(401, 'Invalid cron secret');
      
      if (resourceId === 'reconcile') {
        const result = await runReconciliationJob();
        return sendJson(response, 200, { success: true, ...result });
      }

      if (resourceId === 'cleanup') {
        const result = await runCleanupJob();
        return sendJson(response, 200, { success: true, ...result });
      }

      if (resourceId === 'consistency') {
        const result = await runConsistencyJob();
        return sendJson(response, 200, { success: true, ...result });
      }
    }

    throw new ApiError(404, 'API route not found');
  });
}
