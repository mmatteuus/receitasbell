import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminApiSecret, getMercadoPagoEnv, hasMercadoPagoConfig } from "../src/server/env.js";
import { requireIdentityUser, resolveOptionalIdentityUser } from "../src/server/identity.js";
import {
  ApiError,
  assertMethod,
  clearAdminSessionCookie,
  hasAdminAccess,
  parseStringArray,
  readJsonBody,
  requireAdminAccess,
  requireQueryParam,
  setAdminSessionCookie,
  sendJson,
  sendNoContent,
  withApiHandler,
} from "../src/server/http.js";
import { createCategory, listCategories } from "../src/server/sheets/categoriesRepo.js";
import { createComment, listCommentsByRecipeId } from "../src/server/sheets/commentsRepo.js";
import { createFavorite, deleteFavorite, listFavoritesByUserId } from "../src/server/sheets/favoritesRepo.js";
import { subscribeToNewsletter } from "../src/server/sheets/newsletterRepo.js";
import {
  addPaymentNote,
  createMockCheckout,
  getPaymentById,
  listPayments,
  syncMercadoPagoPayment,
} from "../src/server/sheets/paymentsRepo.js";
import { createRecipe, deleteRecipe, getRecipeById, getRecipeBySlug, listRecipes, updateRecipe } from "../src/server/sheets/recipesRepo.js";
import { getSettingsMap, mapTypedSettings, saveSettings } from "../src/server/sheets/settingsRepo.js";
import {
  createShoppingListItems,
  deleteShoppingListItem,
  listShoppingListItems,
  updateShoppingListItem,
} from "../src/server/sheets/shoppingListRepo.js";
import { findOrCreateUserByEmail } from "../src/server/sheets/usersRepo.js";
import { upsertRating } from "../src/server/sheets/ratingsRepo.js";
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
} from "../src/server/validators.js";

const adminAttemptState = new Map<string, { count: number; blockedUntil: number }>();

function getApiPathSegments(request: VercelRequest) {
  const routedPath = getQueryValue(request.query.route as string | string[] | undefined);
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const rawPath = routedPath || url.pathname.replace(/^\/api\/router\/?/, "").replace(/^\/api\/?/, "");

  return rawPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(decodeURIComponent);
}

function getClientAddress(request: VercelRequest) {
  const forwarded = request.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0] || "unknown";
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "unknown";
  return request.socket.remoteAddress || "unknown";
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return null;
}

function extractMercadoPagoPaymentId(request: VercelRequest, payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  const queryId =
    getQueryValue(request.query.id as string | string[] | undefined) ||
    getQueryValue(request.query["data.id"] as string | string[] | undefined);
  const directId = asText(data?.id) || asText(payload.id) || asText(queryId);

  if (directId) {
    return directId;
  }

  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const { accessToken } = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiError(502, `Mercado Pago payment lookup failed with status ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const segments = getApiPathSegments(request);
    const [resource, resourceId, action] = segments;

    if (!resource) {
      throw new ApiError(404, "API route not found");
    }

    if (resource === "events" && !resourceId) {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<Record<string, unknown>>(request);
      console.info("[event]", JSON.stringify({
        name: body.name || "unknown",
        path: body.path || request.url || "",
        at: body.at || new Date().toISOString(),
        payload: body.payload || {},
      }));
      return sendJson(response, 202, { accepted: true });
    }

    if (resource === "admin" && resourceId === "session") {
      if (request.method === "GET") {
        return sendJson(response, 200, { authenticated: hasAdminAccess(request) });
      }

      if (request.method === "DELETE") {
        clearAdminSessionCookie(request, response);
        return sendNoContent(response);
      }

      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ password?: string }>(request);
      const password = String(body.password || "");
      const clientAddress = getClientAddress(request);
      const now = Date.now();
      const attempt = adminAttemptState.get(clientAddress);

      if (attempt && attempt.blockedUntil > now) {
        throw new ApiError(429, "Muitas tentativas inválidas. Aguarde um minuto e tente novamente.");
      }

      if (password !== getAdminApiSecret()) {
        const nextCount = (attempt?.count || 0) + 1;
        const blockedUntil = nextCount >= 5 ? now + 60_000 : 0;
        adminAttemptState.set(clientAddress, { count: blockedUntil ? 0 : nextCount, blockedUntil });
        throw new ApiError(401, "Senha inválida");
      }

      adminAttemptState.delete(clientAddress);
      setAdminSessionCookie(request, response, password);
      return sendJson(response, 200, { authenticated: true });
    }

    if (resource === "recipes" && !resourceId) {
      if (request.method === "GET") {
        const identity = await resolveOptionalIdentityUser(request);
        const categorySlug = getQueryValue(request.query.categorySlug as string | string[] | undefined);
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

      assertMethod(request, ["POST"]);
      requireAdminAccess(request);
      const body = recipeMutationSchema.parse(await readJsonBody(request));
      const recipe = await createRecipe(body);
      return sendJson(response, 201, { recipe });
    }

    if (resource === "recipes" && resourceId) {
      if (request.method === "GET") {
        const identity = await resolveOptionalIdentityUser(request);
        const lookupBy = getQueryValue(request.query.by as string | string[] | undefined);
        const recipe =
          lookupBy === "id"
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
          throw new ApiError(404, "Recipe not found");
        }

        return sendJson(response, 200, { recipe });
      }

      if (request.method === "PUT") {
        requireAdminAccess(request);
        const body = recipeMutationSchema.parse(await readJsonBody(request));
        const recipe = await updateRecipe(resourceId, body);
        return sendJson(response, 200, { recipe });
      }

      assertMethod(request, ["DELETE"]);
      requireAdminAccess(request);
      await deleteRecipe(resourceId);
      return sendNoContent(response);
    }

    if (resource === "categories" && !resourceId) {
      if (request.method === "GET") {
        const categories = await listCategories();
        return sendJson(response, 200, { categories });
      }

      assertMethod(request, ["POST"]);
      requireAdminAccess(request);
      const body = categorySchema.parse(await readJsonBody(request));
      const category = await createCategory(body);
      return sendJson(response, 201, { category });
    }

    if (resource === "comments" && !resourceId) {
      if (request.method === "GET") {
        const recipeId = requireQueryParam(request, "recipeId");
        const comments = await listCommentsByRecipeId(recipeId);
        return sendJson(response, 200, { comments });
      }

      assertMethod(request, ["POST"]);
      const body = commentSchema.parse(await readJsonBody(request));
      const identity = await requireIdentityUser(request, body.authorName);
      if (!identity.user) {
        throw new ApiError(401, "Identity user not found");
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

    if (resource === "ratings" && !resourceId) {
      assertMethod(request, ["POST"]);
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

    if (resource === "favorites" && !resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === "GET") {
        const favorites = await listFavoritesByUserId(identity.user!.id);
        return sendJson(response, 200, { favorites });
      }

      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ recipeId?: string }>(request);
      const favorite = await createFavorite(identity.user!.id, String(body.recipeId || ""));
      return sendJson(response, 201, { favorite });
    }

    if (resource === "favorites" && resourceId) {
      assertMethod(request, ["DELETE"]);
      const identity = await requireIdentityUser(request);
      await deleteFavorite(identity.user!.id, resourceId);
      return sendNoContent(response);
    }

    if (resource === "settings" && !resourceId) {
      if (request.method === "GET") {
        const settings = mapTypedSettings(await getSettingsMap());
        return sendJson(response, 200, { settings });
      }

      assertMethod(request, ["PUT"]);
      requireAdminAccess(request);
      const body = settingsSchema.parse(await readJsonBody(request));
      const normalized = Object.fromEntries(
        Object.entries(body.settings).map(([key, value]) => [key, value === null ? "" : String(value)]),
      );
      const settings = mapTypedSettings(await saveSettings(normalized));
      return sendJson(response, 200, { settings });
    }

    if (resource === "payments" && !resourceId) {
      assertMethod(request, ["GET"]);
      requireAdminAccess(request);

      const status = parseStringArray(request.query.status);
      const paymentMethod = parseStringArray(request.query.method || request.query.paymentMethod);
      const email = getQueryValue(request.query.email as string | string[] | undefined);
      const paymentId = getQueryValue(request.query.paymentId as string | string[] | undefined);
      const externalReference = getQueryValue(request.query.external_reference as string | string[] | undefined);
      const dateFrom = getQueryValue(request.query.dateFrom as string | string[] | undefined);
      const dateTo = getQueryValue(request.query.dateTo as string | string[] | undefined);

      const payments = await listPayments({
        status: status as never,
        paymentMethod,
        email: email ? String(email) : undefined,
        paymentId: paymentId ? String(paymentId) : undefined,
        externalReference: externalReference ? String(externalReference) : undefined,
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
      });

      return sendJson(response, 200, { payments });
    }

    if (resource === "payments" && resourceId && action === "note") {
      assertMethod(request, ["POST"]);
      requireAdminAccess(request);
      const body = noteSchema.parse(await readJsonBody(request));
      const note = await addPaymentNote(resourceId, body.note);
      return sendJson(response, 201, { note });
    }

    if (resource === "payments" && resourceId && !action) {
      assertMethod(request, ["GET"]);
      requireAdminAccess(request);
      const details = await getPaymentById(resourceId);
      if (!details) {
        throw new ApiError(404, "Payment not found");
      }

      return sendJson(response, 200, details);
    }

    if (resource === "shopping-list" && !resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === "GET") {
        const items = await listShoppingListItems(identity.user!.id);
        return sendJson(response, 200, { items });
      }

      assertMethod(request, ["POST"]);
      const body = shoppingListCreateSchema.parse(await readJsonBody(request));
      const items = await createShoppingListItems(identity.user!.id, body.items);
      return sendJson(response, 201, { items });
    }

    if (resource === "shopping-list" && resourceId) {
      const identity = await requireIdentityUser(request);

      if (request.method === "PUT") {
        const body = shoppingListUpdateSchema.parse(await readJsonBody(request));
        const item = await updateShoppingListItem(identity.user!.id, resourceId, body);
        return sendJson(response, 200, { item });
      }

      assertMethod(request, ["DELETE"]);
      await deleteShoppingListItem(identity.user!.id, resourceId);
      return sendNoContent(response);
    }

    if (resource === "checkout" && !resourceId) {
      assertMethod(request, ["POST"]);
      const body = checkoutSchema.parse(await readJsonBody(request));
      const buyerEmail = body.buyerEmail?.trim().toLowerCase() || "";
      const user = await findOrCreateUserByEmail(buyerEmail);
      const result = await createMockCheckout({
        recipeIds: body.recipeIds,
        buyerEmail,
        userId: user.id,
        checkoutReference: body.checkoutReference,
      });

      return sendJson(response, 201, result);
    }

    if (resource === "newsletter" && !resourceId) {
      assertMethod(request, ["POST"]);
      const body = newsletterSchema.parse(await readJsonBody(request));
      const subscriber = await subscribeToNewsletter(body);
      return sendJson(response, 201, { subscriber });
    }

    if (resource === "mercadopago" && resourceId === "webhook") {
      assertMethod(request, ["POST"]);

      if (!hasMercadoPagoConfig()) {
        throw new ApiError(501, "Mercado Pago webhook is not enabled in this environment");
      }

      const payload = await readJsonBody<Record<string, unknown>>(request);
      const paymentId = extractMercadoPagoPaymentId(request, payload);

      if (!paymentId) {
        return sendJson(response, 202, {
          received: true,
          ignored: true,
          message: "Webhook received without a payment id",
        });
      }

      const paymentPayload = await fetchMercadoPagoPayment(paymentId);
      const payment = await syncMercadoPagoPayment(paymentPayload, payload);

      return sendJson(response, 202, {
        received: true,
        paymentId,
        internalPaymentId: payment.id,
        status: payment.status,
      });
    }

    throw new ApiError(404, "API route not found");
  });
}
