import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from '../src/lib/defaults.js';
import {
  getAdminApiSecret,
  getMercadoPagoEnv,
  getMercadoPagoAppEnv,
  hasMercadoPagoAppConfig,
  hasMercadoPagoConfig,
  hasMercadoPagoWebhookSecret,
} from '../src/server/env.js';
import { requireIdentityUser, resolveOptionalIdentityUser } from '../src/server/identity.js';
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
} from '../src/server/sheets/categoriesRepo.js';
import { listEntitlementsByEmail } from '../src/server/sheets/entitlementsRepo.js';
import { createComment, listCommentsByRecipeId } from '../src/server/sheets/commentsRepo.js';
import {
  createFavorite,
  deleteFavorite,
  listFavoritesByUserId,
} from '../src/server/sheets/favoritesRepo.js';
import { subscribeToNewsletter } from '../src/server/sheets/newsletterRepo.js';
import {
  addPaymentNote,
  createMercadoPagoCheckout,
  createMockCheckout,
  getPaymentById,
  listPayments,
  syncMercadoPagoPayment,
} from '../src/server/sheets/paymentsRepo.js';
import {
  createRecipe,
  deleteRecipe,
  getRecipeById,
  getRecipeBySlug,
  listRecipes,
  updateRecipe,
} from '../src/server/sheets/recipesRepo.js';
import {
  getSettingsMap,
  mapTypedSettings,
  saveSettings,
} from '../src/server/sheets/settingsRepo.js';
import {
  createShoppingListItems,
  deleteShoppingListItem,
  listShoppingListItems,
  updateShoppingListItem,
} from '../src/server/sheets/shoppingListRepo.js';
import { findOrCreateUserByEmail } from '../src/server/sheets/usersRepo.js';
import { upsertRating } from '../src/server/sheets/ratingsRepo.js';
import { deleteRecipeImage, uploadRecipeImage } from '../src/lib/services/googleDriveService.js';
import {
  categorySchema,
  checkoutSchema,
  commentSchema,
  newsletterSchema,
  noteSchema,
  ratingSchema,
  recipeMutationSchema,
  settingsSchema,
  shoppingListCreateSchema,
  shoppingListUpdateSchema,
  uploadRecipeImageSchema,
} from '../src/server/validators.js';
import { assertMercadoPagoWebhookSignature } from '../src/server/payments/mercadoPago.js';
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

const fallbackPublicCategories = sortCategories(DEFAULT_CATEGORIES);

let cachedPublicSettings: SettingsMap = fallbackPublicSettings;
let cachedPublicCategories: Category[] = fallbackPublicCategories;

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || !error) {
    return NaN;
  }

  if ('code' in error) {
    return Number((error as { code?: unknown }).code);
  }

  if ('status' in error) {
    return Number((error as { status?: unknown }).status);
  }

  return NaN;
}

function isRecoverablePublicReadError(error: unknown) {
  if (error instanceof ApiError) {
    return false;
  }

  const code = getErrorCode(error);
  if ([408, 429, 500, 502, 503, 504].includes(code)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  return /timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|socket hang up|google|spreadsheet/i.test(message);
}

async function loadPublicSettings() {
  try {
    const settings = mapTypedSettings(await getSettingsMap());
    cachedPublicSettings = settings;
    return sanitizeSettingsForClient(settings);
  } catch (error) {
    if (!isRecoverablePublicReadError(error)) {
      throw error;
    }

    console.warn('[api/settings] Falling back to cached/default settings after read failure.', error);
    return sanitizeSettingsForClient(cachedPublicSettings);
  }
}

async function loadPublicCategories() {
  try {
    const categories = sortCategories(await listCategories());
    cachedPublicCategories = categories;
    return categories;
  } catch (error) {
    if (!isRecoverablePublicReadError(error)) {
      throw error;
    }

    console.warn('[api/categories] Falling back to cached/default categories after read failure.', error);
    return sortCategories(cachedPublicCategories);
  }
}

function sanitizeSettingsForClient(settings: SettingsMap): SettingsMap {
  return {
    ...settings,
    mp_access_token: '',
    mp_refresh_token: '',
    mp_public_key: '',
    mp_user_id: '',
    mp_client_id: '',
    mp_client_secret: '',
    mp_webhook_secret: '',
  };
}

function getApiPathSegments(request: VercelRequest) {
  const routedPath = getQueryValue(request.query.route as string | string[] | undefined);
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const rawPath =
    routedPath || url.pathname.replace(/^\/api\/router\/?/, '').replace(/^\/api\/?/, '');

  return rawPath
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(decodeURIComponent);
}

function getClientAddress(request: VercelRequest) {
  const forwarded = request.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.socket.remoteAddress || 'unknown';
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return null;
}

function extractMercadoPagoPaymentId(request: VercelRequest, payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  const queryId =
    getQueryValue(request.query.id as string | string[] | undefined) ||
    getQueryValue(request.query['data.id'] as string | string[] | undefined);
  const directId = asText(data?.id) || asText(payload.id) || asText(queryId);

  if (directId) {
    return directId;
  }

  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const { accessToken } = await getMercadoPagoEnv();
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new ApiError(502, `Mercado Pago payment lookup failed with status ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

function readPaymentsFilters(request: VercelRequest) {
  const status = parseStringArray(request.query.status);
  const paymentMethod = parseStringArray(request.query.method || request.query.paymentMethod);
  const email = getQueryValue(request.query.email as string | string[] | undefined);
  const paymentIdGateway = getQueryValue(
    request.query.paymentIdGateway as string | string[] | undefined,
  );
  const paymentId =
    getQueryValue(request.query.paymentId as string | string[] | undefined) ||
    paymentIdGateway;
  const externalReference =
    getQueryValue(request.query.externalReference as string | string[] | undefined) ||
    getQueryValue(request.query.external_reference as string | string[] | undefined);
  const dateFrom =
    getQueryValue(request.query.from as string | string[] | undefined) ||
    getQueryValue(request.query.dateFrom as string | string[] | undefined);
  const dateTo =
    getQueryValue(request.query.to as string | string[] | undefined) ||
    getQueryValue(request.query.dateTo as string | string[] | undefined);

  return {
    status: status as never,
    paymentMethod,
    email: email ? String(email) : undefined,
    paymentId: paymentId ? String(paymentId) : undefined,
    externalReference: externalReference ? String(externalReference) : undefined,
    dateFrom: dateFrom ? String(dateFrom) : undefined,
    dateTo: dateTo ? String(dateTo) : undefined,
  };
}

async function createCheckoutResponse(
  request: VercelRequest,
  body: {
    recipeIds: string[];
    items?: {
      recipeId: string;
      title: string;
      slug: string;
      priceBRL: number;
      imageUrl?: string;
    }[];
    payerName?: string;
    buyerEmail: string;
    checkoutReference: string;
  },
) {
  const buyerEmail = body.buyerEmail.trim().toLowerCase();
  const settings = mapTypedSettings(await getSettingsMap());
  const user = await findOrCreateUserByEmail(buyerEmail);
  const checkoutInput = {
    recipeIds: body.recipeIds,
    items: body.items?.map(item => ({ ...item, imageUrl: item.imageUrl ?? null })),
    payerName: body.payerName,
    buyerEmail,
    userId: user.id,
    checkoutReference: body.checkoutReference,
  };

  if (settings.payment_mode === 'production') {
    const hasConfig = await hasMercadoPagoConfig();
    if (!hasConfig) {
      throw new ApiError(501, 'Mercado Pago is not configured for production checkout');
    }

    if (!settings.webhooks_enabled) {
      throw new ApiError(409, 'Ative os webhooks para usar o checkout real do Mercado Pago.');
    }

    if (!settings.payment_topic_enabled) {
      throw new ApiError(409, 'Ative o tópico payment antes de habilitar o checkout real.');
    }

    if (!hasMercadoPagoWebhookSecret()) {
      throw new ApiError(501, 'Configure MP_WEBHOOK_SECRET na Vercel para habilitar pagamentos reais.');
    }

    return createMercadoPagoCheckout({
      ...checkoutInput,
      baseUrl: getAppBaseUrl(request),
      enableNotifications: settings.webhooks_enabled && settings.payment_topic_enabled,
    });
  }

  return createMockCheckout(checkoutInput);
}

async function processMercadoPagoWebhook(request: VercelRequest) {
  const settings = mapTypedSettings(await getSettingsMap());
  const hasConfig = await hasMercadoPagoConfig();

  if (!hasConfig) {
    throw new ApiError(501, 'Mercado Pago webhook is not enabled in this environment');
  }

  if (!settings.webhooks_enabled) {
    throw new ApiError(503, 'Mercado Pago webhook processing is disabled');
  }

  if (!hasMercadoPagoWebhookSecret()) {
    throw new ApiError(501, 'MP_WEBHOOK_SECRET is not configured');
  }

  const payload = await readJsonBody<Record<string, unknown>>(request);
  const paymentId = extractMercadoPagoPaymentId(request, payload);

  if (!paymentId) {
    return {
      received: true,
      ignored: true,
      message: 'Webhook received without a payment id',
    };
  }

  assertMercadoPagoWebhookSignature(request, paymentId);
  const paymentPayload = await fetchMercadoPagoPayment(paymentId);
  const payment = await syncMercadoPagoPayment(paymentPayload, payload);

  return {
    received: true,
    paymentId,
    internalPaymentId: payment.id,
    status: payment.status,
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const segments = getApiPathSegments(request);
    const [resource, resourceId, action, subaction] = segments;

    if (!resource) {
      throw new ApiError(404, 'API route not found');
    }

    if (resource === 'events' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = await readJsonBody<Record<string, unknown>>(request);
      console.info(
        '[event]',
        JSON.stringify({
          name: body.name || 'unknown',
          path: body.path || request.url || '',
          at: body.at || new Date().toISOString(),
          payload: body.payload || {},
        })
      );
      return sendJson(response, 202, { accepted: true });
    }

    if (resource === 'admin' && resourceId === 'session') {
      if (request.method === 'GET') {
        return sendJson(response, 200, { authenticated: hasAdminAccess(request) });
      }

      if (request.method === 'DELETE') {
        clearAdminSessionCookie(request, response);
        return sendNoContent(response);
      }

      assertMethod(request, ['POST']);
      const body = await readJsonBody<{ password?: string }>(request);
      const password = String(body.password || '');
      const clientAddress = getClientAddress(request);
      const rateResult = await consumeAdminRateLimit(clientAddress);

      if (!rateResult.success) {
        response.setHeader('Retry-After', String(rateResult.resetAfter));
        throw new ApiError(
          429,
          'Muitas tentativas inválidas. Aguarde alguns segundos e tente novamente.'
        );
      }

      if (password !== getAdminApiSecret()) {
        console.warn(`Admin login failed for ${clientAddress} (remaining=${rateResult.remaining})`);
        throw new ApiError(401, 'Senha inválida');
      }

      setAdminSessionCookie(request, response, password);
      return sendJson(response, 200, { authenticated: true });
    }

    if (resource === 'admin' && resourceId === 'payments') {
      requireAdminAccess(request);

      if (request.method === 'GET' && !action) {
        const payments = await listPayments(readPaymentsFilters(request));
        return sendJson(response, 200, { payments });
      }

      if (request.method === 'GET' && action === 'settings' && !subaction) {
        const settings = mapTypedSettings(await getSettingsMap());
        const webhookUrl = `${getAppBaseUrl(request).replace(/\/+$/, '')}/api/payments/mercadopago/webhook`;

        return sendJson(response, 200, {
          settings: {
            payment_mode: settings.payment_mode,
            webhooks_enabled: settings.webhooks_enabled,
            payment_topic_enabled: settings.payment_topic_enabled,
            accessTokenConfigured: await hasMercadoPagoConfig(),
            oauthConfigured: hasMercadoPagoAppConfig(),
            webhookSecretConfigured: hasMercadoPagoWebhookSecret(),
            userId: settings.mp_user_id || null,
            publicKey: settings.mp_public_key || null,
            webhookUrl,
          },
        });
      }

      if (request.method === 'GET' && action && !subaction) {
        const details = await getPaymentById(action);
        if (!details) {
          throw new ApiError(404, 'Payment not found');
        }

        const recipes = (
          await Promise.all(
            details.payment.recipeIds.map((recipeId) =>
              getRecipeById(recipeId, {
                includeDrafts: true,
              })
            )
          )
        ).filter((recipe) => Boolean(recipe));
        const entitlements = (await listEntitlementsByEmail(details.payment.payerEmail)).filter(
          (entitlement) =>
            entitlement.paymentId === details.payment.id ||
            details.payment.items.some((item) => item.slug === entitlement.recipeSlug)
        );

        return sendJson(response, 200, {
          payment: details.payment,
          recipes,
          entitlements,
          events: details.events,
          notes: details.notes,
        });
      }

      if (request.method === 'POST' && action && subaction === 'note') {
        const body = noteSchema.parse(await readJsonBody(request));
        const note = await addPaymentNote(action, body.note);
        return sendJson(response, 201, { note });
      }

      throw new ApiError(404, 'Admin payments route not found');
    }

    if (resource === 'recipes' && !resourceId) {
      if (request.method === 'GET') {
        const identity = await resolveOptionalIdentityUser(request);
        const categorySlug = getQueryValue(
          request.query.categorySlug as string | string[] | undefined
        );
        const q = getQueryValue(request.query.q as string | string[] | undefined);
        const ids = parseStringArray(request.query.ids);
        const recipes = await listRecipes({
          categorySlug: categorySlug ? String(categorySlug) : undefined,
          q: q ? String(q) : undefined,
          ids,
          includeDrafts: hasAdminAccess(request),
          identity: {
            userId: identity.user?.id,
            email: identity.email,
          },
        });

        return sendJson(response, 200, { recipes });
      }

      assertMethod(request, ['POST']);
      requireAdminAccess(request);
      const body = recipeMutationSchema.parse(await readJsonBody(request));
      const recipe = await createRecipe(body);
      return sendJson(response, 201, { recipe });
    }

    if (resource === 'recipes' && resourceId) {
      if (request.method === 'GET') {
        const identity = await resolveOptionalIdentityUser(request);
        const lookupBy = getQueryValue(request.query.by as string | string[] | undefined);
        const recipe =
          lookupBy === 'id'
            ? await getRecipeById(resourceId, {
                includeDrafts: hasAdminAccess(request),
                identity: {
                  userId: identity.user?.id,
                  email: identity.email,
                },
              })
            : await getRecipeBySlug(resourceId, {
                includeDrafts: hasAdminAccess(request),
                identity: {
                  userId: identity.user?.id,
                  email: identity.email,
                },
              });

        if (!recipe) {
          throw new ApiError(404, 'Recipe not found');
        }

        return sendJson(response, 200, { recipe });
      }

      if (request.method === 'PUT') {
        requireAdminAccess(request);
        const body = recipeMutationSchema.parse(await readJsonBody(request));
        const recipe = await updateRecipe(resourceId, body);
        return sendJson(response, 200, { recipe });
      }

      assertMethod(request, ['DELETE']);
      requireAdminAccess(request);
      await deleteRecipe(resourceId);
      return sendNoContent(response);
    }

    if (resource === 'categories' && !resourceId) {
      if (request.method === 'GET') {
        const categories = await loadPublicCategories();
        return sendJson(response, 200, { categories });
      }

      assertMethod(request, ['POST']);
      requireAdminAccess(request);
      const body = categorySchema.parse(await readJsonBody(request));
      const category = await createCategory(body);
      cachedPublicCategories = sortCategories([
        ...cachedPublicCategories.filter((item) => item.id !== category.id),
        category,
      ]);
      return sendJson(response, 201, { category });
    }

    if (resource === 'categories' && resourceId) {
      if (request.method === 'PUT') {
        requireAdminAccess(request);
        const body = categorySchema.parse(await readJsonBody(request));
        const category = await updateCategory(resourceId, body);
        cachedPublicCategories = sortCategories([
          ...cachedPublicCategories.filter((item) => item.id !== category.id),
          category,
        ]);
        return sendJson(response, 200, { category });
      }

      assertMethod(request, ['DELETE']);
      requireAdminAccess(request);
      await deleteCategory(resourceId);
      cachedPublicCategories = sortCategories(
        cachedPublicCategories.filter((item) => item.id !== resourceId),
      );
      return sendNoContent(response);
    }

    if (resource === 'comments' && !resourceId) {
      if (request.method === 'GET') {
        const recipeId = requireQueryParam(request, 'recipeId');
        const comments = await listCommentsByRecipeId(recipeId);
        return sendJson(response, 200, { comments });
      }

      assertMethod(request, ['POST']);
      const body = commentSchema.parse(await readJsonBody(request));
      const identity = await requireIdentityUser(request, body.authorName);
      if (!identity.user) {
        throw new ApiError(401, 'Identity user not found');
      }

      const comment = await createComment({
        recipeId: body.recipeId,
        authorName: body.authorName,
        authorEmail: identity.email,
        userId: identity.user.id,
        text: body.text,
      });

      return sendJson(response, 201, { comment });
    }

    if (resource === 'ratings' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = ratingSchema.parse(await readJsonBody(request));
      const identity = await requireIdentityUser(request);
      const summary = await upsertRating({
        recipeId: body.recipeId,
        value: body.value,
        userId: identity.user?.id,
        authorEmail: identity.email,
      });

      return sendJson(response, 200, summary);
    }

    if (resource === 'favorites' && !resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === 'GET') {
        const favorites = await listFavoritesByUserId(identity.user!.id);
        return sendJson(response, 200, { favorites });
      }

      assertMethod(request, ['POST']);
      const body = await readJsonBody<{ recipeId?: string }>(request);
      const favorite = await createFavorite(identity.user!.id, String(body.recipeId || ''));
      return sendJson(response, 201, { favorite });
    }

    if (resource === 'favorites' && resourceId) {
      assertMethod(request, ['DELETE']);
      const identity = await requireIdentityUser(request);
      await deleteFavorite(identity.user!.id, resourceId);
      return sendNoContent(response);
    }

    if (resource === 'settings' && !resourceId) {
      if (request.method === 'GET') {
        const settings = await loadPublicSettings();
        return sendJson(response, 200, { settings });
      }

      assertMethod(request, ['PUT']);
      requireAdminAccess(request);
      const body = settingsSchema.parse(await readJsonBody(request));
      const normalized = Object.fromEntries(
        Object.entries(body.settings).map(([key, value]) => [
          key,
          value === null ? '' : String(value),
        ])
      );
      const settings = mapTypedSettings(await saveSettings(normalized));
      cachedPublicSettings = settings;
      return sendJson(response, 200, { settings });
    }

    if (resource === 'payments' && !resourceId) {
      assertMethod(request, ['GET']);
      requireAdminAccess(request);
      const payments = await listPayments(readPaymentsFilters(request));

      return sendJson(response, 200, { payments });
    }

    if (resource === 'payments' && resourceId === 'mercadopago' && action === 'create-preference') {
      assertMethod(request, ['POST']);
      const body = checkoutSchema.parse(await readJsonBody(request));
      const result = await createCheckoutResponse(request, body);
      return sendJson(response, 201, result);
    }

    if (resource === 'payments' && resourceId === 'mercadopago' && action === 'webhook') {
      assertMethod(request, ['POST']);
      const result = await processMercadoPagoWebhook(request);
      return sendJson(response, 202, result);
    }

    if (resource === 'payments' && resourceId && action === 'note') {
      assertMethod(request, ['POST']);
      requireAdminAccess(request);
      const body = noteSchema.parse(await readJsonBody(request));
      const note = await addPaymentNote(resourceId, body.note);
      return sendJson(response, 201, { note });
    }

    if (resource === 'payments' && resourceId && !action) {
      assertMethod(request, ['GET']);
      const details = await getPaymentById(resourceId);
      if (!details) {
        throw new ApiError(404, 'Payment not found');
      }

      const identityEmail = getIdentityEmail(request);
      if (!hasAdminAccess(request) && identityEmail !== details.payment.payerEmail) {
        throw new ApiError(404, 'Payment not found');
      }

      return sendJson(response, 200, {
        ...details.payment,
        payment: details.payment,
        events: details.events,
        notes: details.notes,
      });
    }

    if (resource === 'shopping-list' && !resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === 'GET') {
        const items = await listShoppingListItems(identity.user!.id);
        return sendJson(response, 200, { items });
      }

      assertMethod(request, ['POST']);
      const body = shoppingListCreateSchema.parse(await readJsonBody(request));
      const items = await createShoppingListItems(identity.user!.id, body.items);
      return sendJson(response, 201, { items });
    }

    if (resource === 'shopping-list' && resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === 'PUT') {
        const body = shoppingListUpdateSchema.parse(await readJsonBody(request));
        const item = await updateShoppingListItem(identity.user!.id, resourceId, body);
        return sendJson(response, 200, { item });
      }

      assertMethod(request, ['DELETE']);
      await deleteShoppingListItem(identity.user!.id, resourceId);
      return sendNoContent(response);
    }

    if (resource === 'checkout' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = checkoutSchema.parse(await readJsonBody(request));
      const result = await createCheckoutResponse(request, body);
      return sendJson(response, 201, result);
    }

    if (resource === 'uploads' && resourceId === 'recipe-image') {
      if (request.method === 'POST') {
        requireAdminAccess(request);
        const body = uploadRecipeImageSchema.parse(await readJsonBody(request));
        const imageFileMeta = await uploadRecipeImage(body);
        return sendJson(response, 201, {
          imageUrl: imageFileMeta.publicUrl,
          imageFileMeta,
        });
      }

      assertMethod(request, ['DELETE']);
      requireAdminAccess(request);
      const fileId = requireQueryParam(request, 'fileId');
      await deleteRecipeImage(fileId);
      return sendNoContent(response);
    }

    if (resource === 'newsletter' && !resourceId) {
      assertMethod(request, ['POST']);
      const body = newsletterSchema.parse(await readJsonBody(request));
      const subscriber = await subscribeToNewsletter(body);
      return sendJson(response, 201, { subscriber });
    }

    if (resource === 'mercadopago' && resourceId === 'login') {
      try {
        if (!hasMercadoPagoAppConfig()) {
          response.redirect('/admin/pagamentos/configuracoes?error=mp_not_configured');
          return;
        }

        const { clientId } = getMercadoPagoAppEnv();
        const redirectUri = getAppBaseUrl(request) + '/api/mercadopago/oauth';
        const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}`;
        response.redirect(authUrl);
      } catch (error) {
        console.error('Mercado Pago App Env Error:', error);
        response.redirect('/admin/pagamentos/configuracoes?error=mp_not_configured');
      }
      return;
    }

    if (resource === 'mercadopago' && resourceId === 'webhook') {
      assertMethod(request, ['POST']);
      const result = await processMercadoPagoWebhook(request);
      return sendJson(response, 202, result);
    }

    if (resource === 'mercadopago' && resourceId === 'oauth') {
      assertMethod(request, ['GET']);
      const { code } = request.query;
      if (!code || typeof code !== 'string') {
        response.redirect('/admin/pagamentos/configuracoes?error=mp_missing_code');
        return;
      }

      const { clientId, clientSecret } = getMercadoPagoAppEnv();
      const redirectUri = getAppBaseUrl(request) + '/api/mercadopago/oauth';
      
      const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_secret: clientSecret,
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('MP OAuth error', await tokenResponse.text());
        response.redirect('/admin/pagamentos/configuracoes?error=mp_oauth_failed');
        return;
      }

      const tokenData = await tokenResponse.json() as Record<string, unknown>;
      
      await saveSettings({
        mp_access_token: String(tokenData.access_token || ''),
        mp_refresh_token: String(tokenData.refresh_token || ''),
        mp_public_key: String(tokenData.public_key || ''),
        mp_user_id: String(tokenData.user_id || ''),
      });

      response.redirect('/admin/pagamentos/configuracoes?connected=1');
      return;
    }

    throw new ApiError(404, 'API route not found');
  });
}
