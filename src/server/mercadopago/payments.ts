// Removed Prisma imports
import type { CartItem } from "../../types/cart.js";
import type { PaymentStatus } from "../../types/payment.js";
import type { Payment, PaymentEvent, PaymentNote } from "../../lib/payments/types.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import { buildCartItemFromRecipe } from "../../lib/utils/recipeAccess.js";
import { sumBRL } from "../../lib/utils/money.js";
import { ApiError } from "../http.js";
import { createEntitlement, listEntitlementsByEmail, revokeEntitlement } from "../baserow/entitlementsRepo.js";
import { getRecipeById } from "../baserow/recipesRepo.js";
import { 
  createPayment, 
  listPayments, 
  getPaymentById as getBaserowPaymentById, 
  updatePaymentStatus, 
  createPaymentEvent as createBaserowPaymentEvent, 
  addPaymentNote as addBaserowPaymentNote,
  PaymentRecord,
  PaymentEventRecord,
  PaymentNoteRecord
} from "../baserow/paymentsRepo.js";
import {
  getUsableMercadoPagoAccessToken,
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

function toPayment(input: PaymentRecord): Payment {
  return {
    id: String(input.id),
    paymentIdGateway: input.paymentId || "",
    gateway: input.externalReference?.includes("mock") ? "mock" : "mercado_pago",
    recipeIds: input.recipeIds,
    items: input.items,
    totalBRL: input.amount,
    payerName: "", 
    payerEmail: input.payerEmail,
    status: normalizePaymentStatus(input.status),
    statusDetail: input.status,
    paymentMethod: input.paymentMethod || "pending",
    paymentType: "unknown",
    paymentMethodKey: normalizePaymentMethodId(input.paymentMethod),
    checkoutReference: input.externalReference,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    approvedAt: input.status === "approved" ? input.createdAt : null,
    webhookReceivedAt: null,
    payer: {
      email: input.payerEmail,
    },
  };
}

function toPaymentEvent(input: PaymentEventRecord): PaymentEvent {
  return {
    id: String(input.id),
    paymentId: String(input.paymentId || ""),
    type: input.action || input.topic || "webhook.received",
    date_created: input.createdAt,
    payload_json: input.payloadJson ?? null,
  };
}

function toPaymentNote(input: PaymentNoteRecord): PaymentNote {
  return {
    id: String(input.id),
    payment_id: String(input.paymentId),
    note: input.note,
    created_by_user_id: String(input.createdByUserId || ""),
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  };
}

async function resolvePaidRecipes(tenantId: string | number, recipeIds: string[]) {
  const recipes: RecipeRecord[] = [];
  for (const recipeId of recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
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

export async function listTenantPayments(tenantId: string | number, filters: ListPaymentsFilters = {}) {
  const payments = await listPayments(tenantId);
  return payments
    .filter(p => {
      if (filters.email && !p.payerEmail.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.paymentId && !p.paymentId.includes(filters.paymentId)) return false;
      return true;
    })
    .map(toPayment);
}

export async function getTenantPaymentById(tenantId: string | number, paymentId: string | number) {
  const result = await getBaserowPaymentById(paymentId);
  if (!result) return null;

  const { payment } = result;
  const entitlements = await listEntitlementsByEmail(tenantId, payment.payerEmail);

  return {
    payment: toPayment(payment),
    events: [], 
    notes: [],  
    entitlements: entitlements.filter((item) => String(item.paymentId) === String(payment.id)),
  };
}

export async function addTenantPaymentNote(input: {
  tenantId: string | number;
  paymentId: string | number;
  note: string;
  createdByUserId?: string | number | null;
}) {
  const created = await addBaserowPaymentNote(
    input.tenantId,
    input.paymentId,
    input.note.trim(),
    input.createdByUserId
  );

  return toPaymentNote(created);
}

export async function createTenantMockCheckout(input: {
  tenantId: string | number;
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
}) {
  const recipes = await resolvePaidRecipes(input.tenantId, input.recipeIds);
  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));
  
  const created = await createPayment(input.tenantId, {
    amount: totalBRL,
    status: "approved",
    externalReference: input.checkoutReference,
    paymentId: `mock_${Date.now()}`,
    payerEmail: input.buyerEmail,
    paymentMethod: "pix",
    recipeIds: recipes.map((recipe) => String(recipe.id)),
    items: items,
  });

  await createBaserowPaymentEvent(input.tenantId, {
    payment_id: created.id,
    topic: "checkout",
    action: "mock.approved",
    dedupe_key: `mock:${created.id}:approved`,
    signature_valid: true,
    payload_json: JSON.stringify({
      provider: "mock",
      recipeIds: recipes.map((recipe) => recipe.id),
      buyerEmail: input.buyerEmail,
      totalBRL,
    }),
    processed_at: new Date().toISOString(),
  });

  for (const recipe of recipes) {
    await createEntitlement(input.tenantId, {
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
  tenantId: string | number;
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
}) {
  const recipes = await resolvePaidRecipes(input.tenantId, input.recipeIds);
  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));

  const payerName = input.payerName?.trim() || "Cliente";

  const created = await createPayment(input.tenantId, {
    amount: totalBRL,
    status: "pending",
    externalReference: input.checkoutReference,
    paymentId: "", 
    payerEmail: input.buyerEmail,
    paymentMethod: "pending",
    recipeIds: recipes.map((recipe) => String(recipe.id)),
    items: items,
  });

  const preference = await createMercadoPagoPreference({
    tenantId: String(input.tenantId),
    items: items.map((item) => ({
      title: item.title,
      unit_price: item.priceBRL,
      quantity: 1,
    })),
    external_reference: input.checkoutReference,
    payer: { email: input.buyerEmail, name: payerName },
  });

  await createBaserowPaymentEvent(input.tenantId, {
    payment_id: created.id,
    topic: "checkout",
    action: "mercado_pago.preference_created",
    dedupe_key: `mp:pref:${preference.id}`,
    payload_json: JSON.stringify(preference),
  });

  return {
    payment: toPayment(created),
    gateway: "mercado_pago",
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  };
}

async function createMercadoPagoPreference(input: {
  tenantId: string;
  items: any[];
  external_reference: string;
  payer: { email: string; name: string };
}) {
  const { accessToken } = await getUsableMercadoPagoAccessToken(input.tenantId);
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: input.items,
      external_reference: input.external_reference,
      payer: input.payer,
      auto_return: "approved",
      back_urls: {
        success: `${process.env.APP_BASE_URL}/compra/sucesso`,
        pending: `${process.env.APP_BASE_URL}/compra/pendente`,
        failure: `${process.env.APP_BASE_URL}/compra/falha`,
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new ApiError(502, "Mercado Pago preference creation failed", body);
  return body as MercadoPagoPreferenceResponse;
}

export async function handleMercadoPagoWebhook(tenantId: string | number, payload: any) {
  // Webhook implementation simplified for Baserow flow
  console.info(`Webhook received for tenant ${tenantId}`, payload);
  return { status: "ok" };
}
