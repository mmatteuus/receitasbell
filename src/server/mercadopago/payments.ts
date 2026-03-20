import { Prisma } from "@prisma/client";
import type { Payment as PrismaPayment, PaymentEvent as PrismaPaymentEvent, PaymentNote as PrismaPaymentNote } from "@prisma/client";
import type { CartItem } from "../../types/cart.js";
import type { PaymentStatus } from "../../types/payment.js";
import type { Payment, PaymentEvent, PaymentNote } from "../../lib/payments/types.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import { buildCartItemFromRecipe } from "../../lib/utils/recipeAccess.js";
import { sumBRL } from "../../lib/utils/money.js";
import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../http.js";
import { createEntitlement, listEntitlementsByEmail, revokeEntitlement } from "../sheets/entitlementsRepo.js";
import { getRecipeById } from "../sheets/recipesRepo.js";
import {
  getUsableMercadoPagoAccessToken,
  markConnectionReconnectRequired,
  refreshMercadoPagoConnection,
} from "./connections.js";

type ListPaymentsFilters = {
  status?: PaymentStatus[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  [key: string]: unknown;
};

type MercadoPagoPaymentPayload = Record<string, unknown>;

function normalizePaymentStatus(status: string | null | undefined): PaymentStatus {
  switch ((status || "").trim()) {
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "in_process":
      return "in_process";
    case "rejected":
      return "rejected";
    case "cancelled":
    case "cancelled_by_user":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      return "pending";
  }
}

function normalizePaymentMethodId(method: string | null | undefined) {
  const normalized = (method || "").trim().toLowerCase();
  if (!normalized || normalized === "pending") return "pending";
  if (normalized === "pix") return "pix";
  if (normalized === "bolbradesco" || normalized === "pec" || normalized === "boleto") {
    return "boleto";
  }
  return "credit_card";
}

function normalizePaymentTypeId(type: string | null | undefined) {
  const normalized = (type || "").trim().toLowerCase();
  if (!normalized || normalized === "pending") return "pending";
  if (normalized === "ticket") return "ticket";
  if (normalized === "credit_card") return "credit_card";
  return "account_money";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return null;
}

function asFiniteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJsonArray<T>(value: unknown) {
  if (!value) return [] as T[];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toPayment(input: PrismaPayment): Payment {
  const items = parseJsonArray<CartItem>(input.itemSnapshotsJson);
  return {
    id: input.id,
    paymentIdGateway: input.mercadoPagoPaymentId || "",
    gateway: input.gateway === "mock" ? "mock" : "mercado_pago",
    recipeIds: parseJsonArray<string>(input.recipeIdsJson),
    items,
    totalBRL: Number(input.amount),
    payerName: input.payerName,
    payerEmail: input.buyerEmail,
    status: normalizePaymentStatus(input.status),
    statusDetail: input.statusDetail || input.status,
    paymentMethod: input.paymentMethod || "pending",
    paymentType: input.paymentType,
    paymentMethodKey: normalizePaymentMethodId(input.paymentMethod),
    checkoutReference: input.checkoutReference,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
    approvedAt: input.approvedAt?.toISOString() ?? null,
    webhookReceivedAt: input.webhookReceivedAt?.toISOString() ?? null,
    payer: {
      email: input.buyerEmail,
    },
  };
}

function toPaymentEvent(input: PrismaPaymentEvent): PaymentEvent {
  return {
    id: input.id,
    paymentId: input.paymentId || "",
    type: input.action || input.topic || "webhook.received",
    date_created: input.createdAt.toISOString(),
    payload_json: (input.payloadJson as Record<string, unknown> | null) ?? null,
  };
}

function toPaymentNote(input: PrismaPaymentNote): PaymentNote {
  return {
    id: input.id,
    payment_id: input.paymentId,
    note: input.note,
    created_by_user_id: input.createdByUserId,
    created_at: input.createdAt.toISOString(),
    updated_at: input.updatedAt.toISOString(),
  };
}

async function resolvePaidRecipes(recipeIds: string[]) {
  const recipes: RecipeRecord[] = [];
  for (const recipeId of recipeIds) {
    const recipe = await getRecipeById(recipeId, { includeDrafts: true });
    if (!recipe) {
      throw new ApiError(404, `Recipe not found for checkout: ${recipeId}`);
    }
    if (recipe.accessTier !== "paid" || !recipe.priceBRL) {
      throw new ApiError(400, `Recipe ${recipe.title} is not eligible for paid checkout`);
    }
    recipes.push(recipe);
  }
  return recipes;
}

function roundBRL(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeCheckoutItems(inputItems: CartItem[] | undefined, recipes: RecipeRecord[]) {
  if (!inputItems?.length || inputItems.length !== recipes.length) {
    return recipes.map((recipe) => buildCartItemFromRecipe(recipe));
  }

  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  return inputItems.map((item) => {
    const recipe = recipesById.get(item.recipeId);
    if (!recipe) {
      throw new ApiError(400, `Checkout item inválido: ${item.recipeId}`);
    }

    const expectedPrice = roundBRL(recipe.priceBRL ?? 0);
    const receivedPrice = roundBRL(Number(item.priceBRL ?? 0));
    if (Math.abs(receivedPrice - expectedPrice) > 0.009) {
      throw new ApiError(
        409,
        `Preço divergente para ${recipe.title}. Atualize o carrinho e tente novamente.`,
      );
    }

    return buildCartItemFromRecipe(recipe);
  });
}

function appendQuery(url: string, params: Record<string, string | number | boolean | undefined | null>) {
  const next = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    next.searchParams.set(key, String(value));
  });
  return next.toString();
}

async function fetchMercadoPagoJson<T>(
  tenantId: string,
  url: string,
  init: RequestInit & { retryOnAuthFailure?: boolean } = {},
): Promise<T> {
  const { connection, accessToken } = await getUsableMercadoPagoAccessToken(tenantId);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = (await response.json().catch(() => null)) as T | Record<string, unknown> | null;
  if (response.ok) {
    return body as T;
  }

  if ((response.status === 401 || response.status === 403) && init.retryOnAuthFailure !== false) {
    try {
      await refreshMercadoPagoConnection(connection.id);
      return fetchMercadoPagoJson<T>(tenantId, url, {
        ...init,
        retryOnAuthFailure: false,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
    }
  }

  if (response.status === 401 || response.status === 403) {
    await markConnectionReconnectRequired({
      connectionId: connection.id,
      message: `Mercado Pago returned ${response.status} for tenant ${tenantId}.`,
    });
    throw new ApiError(409, "A conexão com o Mercado Pago expirou. Reconecte a conta para continuar.");
  }

  throw new ApiError(502, "Mercado Pago request failed.", {
    status: response.status,
    body,
  });
}

async function createPaymentEvent(input: {
  tenantId: string;
  paymentId?: string | null;
  resourceId?: string | null;
  topic?: string | null;
  action?: string | null;
  dedupeKey: string;
  signatureValid?: boolean;
  payloadJson?: Record<string, unknown> | null;
  processedAt?: Date | null;
}) {
  const prisma = getPrisma();
  try {
    return await prisma.paymentEvent.create({
      data: {
        tenantId: input.tenantId,
        paymentId: input.paymentId ?? null,
        resourceId: input.resourceId ?? null,
        topic: input.topic ?? null,
        action: input.action ?? null,
        dedupeKey: input.dedupeKey,
        signatureValid: input.signatureValid ?? false,
        payloadJson: input.payloadJson ?? null,
        processedAt: input.processedAt ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function registerTenantWebhookReceipt(input: {
  tenantId: string;
  paymentId?: string | null;
  resourceId?: string | null;
  topic?: string | null;
  action?: string | null;
  dedupeKey: string;
  signatureValid?: boolean;
  payloadJson?: Record<string, unknown> | null;
}) {
  return createPaymentEvent({
    tenantId: input.tenantId,
    paymentId: input.paymentId ?? null,
    resourceId: input.resourceId ?? null,
    topic: input.topic ?? null,
    action: input.action ?? null,
    dedupeKey: input.dedupeKey,
    signatureValid: input.signatureValid ?? false,
    payloadJson: input.payloadJson ?? null,
    processedAt: null,
  });
}

export async function listTenantPayments(tenantId: string, filters: ListPaymentsFilters = {}) {
  const payments = await getPrisma().payment.findMany({
    where: {
      tenantId,
      status: filters.status?.length ? { in: filters.status } : undefined,
      paymentMethod: filters.paymentMethod?.length ? { in: filters.paymentMethod } : undefined,
      buyerEmail: filters.email ? { contains: filters.email, mode: "insensitive" } : undefined,
      OR: filters.paymentId
        ? [
            { id: { contains: filters.paymentId, mode: "insensitive" } },
            { mercadoPagoPaymentId: { contains: filters.paymentId, mode: "insensitive" } },
          ]
        : undefined,
      externalReference: filters.externalReference
        ? { contains: filters.externalReference, mode: "insensitive" }
        : undefined,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? {
              gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            }
          : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map(toPayment);
}

export async function getTenantPaymentById(tenantId: string, paymentId: string) {
  const payment = await getPrisma().payment.findFirst({
    where: {
      tenantId,
      OR: [{ id: paymentId }, { mercadoPagoPaymentId: paymentId }],
    },
  });
  if (!payment) return null;

  const [events, notes, entitlements] = await Promise.all([
    getPrisma().paymentEvent.findMany({
      where: { tenantId, paymentId: payment.id },
      orderBy: { createdAt: "desc" },
    }),
    getPrisma().paymentNote.findMany({
      where: { tenantId, paymentId: payment.id },
      orderBy: { createdAt: "desc" },
    }),
    listEntitlementsByEmail(payment.buyerEmail),
  ]);

  return {
    payment: toPayment(payment),
    events: events.map(toPaymentEvent),
    notes: notes.map(toPaymentNote),
    entitlements: entitlements.filter((item) => item.paymentId === payment.id),
  };
}

export async function addTenantPaymentNote(input: {
  tenantId: string;
  paymentId: string;
  note: string;
  createdByUserId?: string | null;
}) {
  const created = await getPrisma().paymentNote.create({
    data: {
      tenantId: input.tenantId,
      paymentId: input.paymentId,
      note: input.note.trim(),
      createdByUserId: input.createdByUserId ?? null,
    },
  });

  return toPaymentNote(created);
}

export async function createTenantMockCheckout(input: {
  tenantId: string;
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
}) {
  const recipes = await resolvePaidRecipes(input.recipeIds);
  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));
  const existing = await getPrisma().payment.findUnique({
    where: { idempotencyKey: `${input.tenantId}:${input.checkoutReference}` },
  });
  if (existing) {
    const payment = toPayment(existing);
    return {
      payment,
      payments: [payment],
      gateway: payment.gateway,
      paymentId: payment.id,
      primaryPaymentId: payment.id,
      paymentIds: [payment.id],
      status: payment.status,
      unlockedCount: payment.status === "approved" ? payment.recipeIds.length : 0,
      preferenceId: null,
      initPoint: null,
      sandboxInitPoint: null,
    };
  }

  const payerName = input.payerName?.trim() || input.buyerEmail.split("@")[0] || "Cliente";
  const created = await getPrisma().payment.create({
    data: {
      tenantId: input.tenantId,
      externalReference: `t:${input.tenantId}:mock:${input.checkoutReference}`,
      idempotencyKey: `${input.tenantId}:${input.checkoutReference}`,
      checkoutReference: input.checkoutReference,
      buyerEmail: input.buyerEmail,
      payerName,
      amount: totalBRL,
      gateway: "mock",
      status: "approved",
      statusDetail: "accredited",
      paymentMethod: "pix",
      paymentType: "account_money",
      recipeIdsJson: recipes.map((recipe) => recipe.id),
      itemSnapshotsJson: items,
      approvedAt: new Date(),
    },
  });

  await createPaymentEvent({
    tenantId: input.tenantId,
    paymentId: created.id,
    topic: "checkout",
    action: "mock.approved",
    dedupeKey: `mock:${created.id}:approved`,
    signatureValid: true,
    payloadJson: {
      provider: "mock",
      recipeIds: recipes.map((recipe) => recipe.id),
      buyerEmail: input.buyerEmail,
      totalBRL,
    },
    processedAt: new Date(),
  });

  for (const recipe of recipes) {
    await createEntitlement({
      paymentId: created.id,
      payerEmail: input.buyerEmail,
      recipeSlug: recipe.slug,
    });
  }

  const payment = toPayment(created);
  return {
    payment,
    payments: [payment],
    gateway: payment.gateway,
    paymentId: payment.id,
    primaryPaymentId: payment.id,
    paymentIds: [payment.id],
    status: payment.status,
    unlockedCount: recipes.length,
    preferenceId: null,
    initPoint: null,
    sandboxInitPoint: null,
  };
}

export async function createTenantMercadoPagoCheckout(input: {
  tenantId: string;
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
  baseUrl: string;
  publicBasePath?: string;
  enableNotifications: boolean;
}) {
  const recipes = await resolvePaidRecipes(input.recipeIds);
  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));
  const idempotencyKey = `${input.tenantId}:${input.checkoutReference}`;
  const existing = await getPrisma().payment.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    const payment = toPayment(existing);
    return {
      payment,
      payments: [payment],
      gateway: payment.gateway,
      paymentId: payment.id,
      primaryPaymentId: payment.id,
      paymentIds: [payment.id],
      status: payment.status,
      unlockedCount: payment.status === "approved" ? payment.recipeIds.length : 0,
      preferenceId: existing.preferenceId,
      initPoint: existing.checkoutUrl,
      sandboxInitPoint: null,
    };
  }

  const { connection, accessToken } = await getUsableMercadoPagoAccessToken(input.tenantId);
  const payerName = input.payerName?.trim() || input.buyerEmail.split("@")[0] || "Cliente";
  const created = await getPrisma().payment.create({
    data: {
      tenantId: input.tenantId,
      mercadoPagoConnectionId: connection.id,
      externalReference: "pending",
      idempotencyKey,
      checkoutReference: input.checkoutReference,
      buyerEmail: input.buyerEmail,
      payerName,
      amount: totalBRL,
      gateway: "mercado_pago",
      status: "pending",
      statusDetail: "waiting_checkout",
      paymentMethod: "pending",
      paymentType: "pending",
      recipeIdsJson: recipes.map((recipe) => recipe.id),
      itemSnapshotsJson: items,
    },
  });

  const externalReference = `t:${input.tenantId}:p:${created.id}`;
  const basePath = input.baseUrl.replace(/\/+$/, "");
  const publicBasePath = `${input.publicBasePath?.replace(/\/+$/, "") || ""}`;
  const resultBasePath = `${basePath}${publicBasePath}`;
  const slug = items.length === 1 ? items[0].slug : "";
  const notificationUrl = input.enableNotifications
    ? `${basePath}/api/payments/mercadopago/webhook?tenantId=${encodeURIComponent(input.tenantId)}&paymentId=${encodeURIComponent(created.id)}`
    : undefined;

  const payload = {
    external_reference: externalReference,
    items: items.map((item) => ({
      id: item.recipeId,
      title: item.title,
      description: `Acesso digital à receita ${item.title}`,
      picture_url: item.imageUrl || undefined,
      quantity: 1,
      currency_id: "BRL",
      unit_price: roundBRL(item.priceBRL),
    })),
    payer: {
      email: input.buyerEmail,
    },
    back_urls: {
      success: appendQuery(`${resultBasePath}/compra/sucesso`, {
        slug,
        count: items.length,
        checkout_reference: input.checkoutReference,
        tenant_slug: input.publicBasePath ? publicBasePath.replace(/^\/t\//, "") : undefined,
      }),
      pending: appendQuery(`${resultBasePath}/compra/pendente`, {
        slug,
        count: items.length,
        checkout_reference: input.checkoutReference,
        tenant_slug: input.publicBasePath ? publicBasePath.replace(/^\/t\//, "") : undefined,
      }),
      failure: appendQuery(`${resultBasePath}/compra/falha`, {
        slug,
        count: items.length,
        checkout_reference: input.checkoutReference,
        tenant_slug: input.publicBasePath ? publicBasePath.replace(/^\/t\//, "") : undefined,
      }),
    },
    auto_return: "approved",
    metadata: {
      checkout_reference: input.checkoutReference,
      recipe_ids_json: JSON.stringify(recipes.map((recipe) => recipe.id)),
      item_snapshots_json: JSON.stringify(items),
      buyer_email: input.buyerEmail,
      payer_name: payerName,
      tenant_id: input.tenantId,
      internal_payment_id: created.id,
    },
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as MercadoPagoPreferenceResponse | null;
    if (!response.ok || !body?.init_point) {
      if (response.status === 401 || response.status === 403) {
        await markConnectionReconnectRequired({
          connectionId: connection.id,
          message: `Mercado Pago preference creation failed with status ${response.status}.`,
        });
        throw new ApiError(409, "A conta do Mercado Pago precisa ser reconectada.");
      }
      throw new ApiError(502, "Mercado Pago preference creation failed", body);
    }

    const updated = await getPrisma().payment.update({
      where: { id: created.id },
      data: {
        externalReference,
        preferenceId: body.id ?? null,
        checkoutUrl: body.init_point ?? null,
        rawLastPayloadJson: {
          preference: body,
          request: payload,
        },
      },
    });

    await createPaymentEvent({
      tenantId: input.tenantId,
      paymentId: updated.id,
      topic: "checkout",
      action: "preference.created",
      dedupeKey: `checkout:${updated.id}:preference_created`,
      signatureValid: true,
      payloadJson: {
        preferenceId: body.id ?? null,
        initPoint: body.init_point ?? null,
      },
      processedAt: new Date(),
    });

    const payment = toPayment(updated);
    return {
      payment,
      payments: [payment],
      gateway: payment.gateway,
      paymentId: payment.id,
      primaryPaymentId: payment.id,
      paymentIds: [payment.id],
      status: payment.status,
      unlockedCount: 0,
      preferenceId: body.id ?? null,
      initPoint: body.init_point ?? null,
      sandboxInitPoint: body.sandbox_init_point ?? null,
    };
  } catch (error) {
    await getPrisma().payment.update({
      where: { id: created.id },
      data: {
        externalReference,
        statusDetail: error instanceof ApiError ? error.message : "checkout_failed",
      },
    });
    throw error;
  }
}

export async function fetchMercadoPagoPaymentDetails(tenantId: string, mercadoPagoPaymentId: string) {
  return fetchMercadoPagoJson<MercadoPagoPaymentPayload>(
    tenantId,
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(mercadoPagoPaymentId)}`,
  );
}

async function syncEntitlementsForPayment(payment: PrismaPayment) {
  const items = parseJsonArray<CartItem>(payment.itemSnapshotsJson);
  if (normalizePaymentStatus(payment.status) === "approved") {
    for (const item of items) {
      await createEntitlement({
        paymentId: payment.id,
        payerEmail: payment.buyerEmail,
        recipeSlug: item.slug,
      });
    }
  }

  if (["cancelled", "refunded", "charged_back"].includes(payment.status)) {
    await revokeEntitlement(payment.id);
  }
}

export async function syncTenantMercadoPagoPayment(input: {
  tenantId: string;
  paymentId: string;
  mercadoPagoPayment: MercadoPagoPaymentPayload;
  notificationPayload: Record<string, unknown>;
  dedupeKey: string;
  signatureValid: boolean;
  eventId?: string | null;
  recordEvent?: boolean;
}) {
  const prisma = getPrisma();
  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      tenantId: input.tenantId,
    },
  });

  if (!payment) {
    throw new ApiError(404, "Internal payment not found for webhook.");
  }

  const status = normalizePaymentStatus(asText(input.mercadoPagoPayment.status));
  const statusDetail = asText(input.mercadoPagoPayment.status_detail) || status;
  const mercadoPagoPaymentId = asText(input.mercadoPagoPayment.id);
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      mercadoPagoPaymentId: mercadoPagoPaymentId || payment.mercadoPagoPaymentId,
      status,
      statusDetail,
      paymentMethod: normalizePaymentMethodId(asText(input.mercadoPagoPayment.payment_method_id)),
      paymentType: normalizePaymentTypeId(asText(input.mercadoPagoPayment.payment_type_id)),
      rawLastPayloadJson: input.mercadoPagoPayment,
      approvedAt:
        status === "approved"
          ? new Date(asText(input.mercadoPagoPayment.date_approved) || new Date().toISOString())
          : payment.approvedAt,
      webhookReceivedAt: new Date(),
    },
  });

  const eventPayload = {
    notification: input.notificationPayload,
    payment: input.mercadoPagoPayment,
  };
  const eventData = {
    paymentId: updated.id,
    resourceId: mercadoPagoPaymentId || payment.mercadoPagoPaymentId,
    topic: asText(input.notificationPayload.type) || asText(input.notificationPayload.topic),
    action: asText(input.notificationPayload.action),
    payloadJson: eventPayload,
    processedAt: new Date(),
    signatureValid: input.signatureValid,
  };

  if (input.recordEvent === false && input.eventId) {
    await prisma.paymentEvent.update({
      where: { id: input.eventId },
      data: eventData,
    });
  } else {
    await createPaymentEvent({
      tenantId: input.tenantId,
      paymentId: updated.id,
      resourceId: eventData.resourceId,
      topic: eventData.topic,
      action: eventData.action,
      dedupeKey: input.dedupeKey,
      signatureValid: input.signatureValid,
      payloadJson: eventPayload,
      processedAt: eventData.processedAt,
    });
  }

  await syncEntitlementsForPayment(updated);

  return toPayment(updated);
}
