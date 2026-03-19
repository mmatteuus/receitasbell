import type { Recipe } from '../../types/recipe.js';
import type { CartItem } from '../../types/cart.js';
import type { Payment, PaymentEvent, PaymentNote } from '../../lib/payments/types.js';
import type { PaymentStatus } from '../../types/payment.js';
import { buildCartItemFromRecipe } from '../../lib/utils/recipeAccess.js';
import { sumBRL } from '../../lib/utils/money.js';
import { ApiError } from '../http.js';
import { mutateTable, readTable } from './table.js';
import { createEntitlement, revokeEntitlement } from './entitlementsRepo.js';
import { getRecipeById, getRecipeBySlug } from './recipesRepo.js';
import { SheetRecord } from './schema.js';
import { nowIso, asJson, asNumber, asNullableString, toJsonString } from './utils.js';
import { findOrCreateUserByEmail } from './usersRepo.js';
import { createMercadoPagoPreference } from '../payments/mercadoPago.js';

interface ListPaymentsFilters {
  status?: PaymentStatus[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
}

type MercadoPagoPayload = Record<string, unknown>;

function buildLegacyItem(row: SheetRecord<'payments'>): CartItem | null {
  const recipeId = row.recipe_id?.trim();
  const slug = row.external_reference?.trim();
  if (!recipeId && !slug) {
    return null;
  }

  return {
    recipeId: recipeId || slug || row.id,
    title: slug || 'Receita',
    slug: slug || recipeId || row.id,
    priceBRL: asNumber(row.total_brl || row.transaction_amount),
    imageUrl: '',
  };
}

function getPaymentItems(row: SheetRecord<'payments'>) {
  const items = asJson<CartItem[]>(row.item_snapshots_json, []);
  if (items.length > 0) {
    return items;
  }

  const legacyItem = buildLegacyItem(row);
  return legacyItem ? [legacyItem] : [];
}

function getPaymentRecipeIds(row: SheetRecord<'payments'>, items: CartItem[]) {
  const recipeIds = asJson<string[]>(row.recipe_ids_json, []);
  if (recipeIds.length > 0) {
    return recipeIds;
  }

  if (items.length > 0) {
    return items.map((item) => item.recipeId);
  }

  return row.recipe_id?.trim() ? [row.recipe_id] : [];
}

function mapPayment(row: SheetRecord<'payments'>): Payment {
  const items = getPaymentItems(row);
  const recipeIds = getPaymentRecipeIds(row, items);
  const payerEmail = row.payer_email || row.buyer_email;
  const payerName = row.payer_name || payerEmail.split('@')[0] || 'Cliente';
  const gateway =
    row.gateway === 'mercado_pago' || row.provider === 'mercadopago' ? 'mercado_pago' : 'mock';
  const paymentMethodId = normalizePaymentMethodId(row.payment_method_id || row.payment_method);
  const paymentTypeId = normalizePaymentTypeId(row.payment_type_id || row.payment_type);
  const totalBRL = asNumber(row.total_brl || row.transaction_amount);
  const createdAt = row.created_at || row.date_created || nowIso();
  const updatedAt = row.updated_at || row.approved_at || row.date_approved || createdAt;
  const approvedAt = asNullableString(row.approved_at || row.date_approved);
  const primaryReference = items[0]?.slug || row.external_reference || recipeIds[0] || '';

  return {
    id: row.id,
    paymentIdGateway: asNullableString(row.payment_id_gateway || row.external_payment_id) || '',
    gateway,
    recipeIds,
    items,
    totalBRL,
    payerName,
    payerEmail,
    status: normalizePaymentStatus(row.status),
    statusDetail: row.status_detail || normalizePaymentStatus(row.status),
    paymentMethod: row.payment_method || paymentMethodId,
    paymentType: row.payment_type || paymentTypeId,
    paymentMethodKey: paymentMethodId,
    checkoutReference: asNullableString(row.checkout_reference),
    createdAt,
    updatedAt,
    approvedAt,
    webhookReceivedAt: asNullableString(row.webhook_received_at),
    payer: {
      email: payerEmail,
    },
  };
}

function mapEvent(row: SheetRecord<'payment_events'>): PaymentEvent {
  return {
    id: row.id,
    paymentId: row.payment_id,
    type: row.type,
    date_created: row.date_created,
    payload_json: asJson<Record<string, unknown> | null>(row.payload_json, null),
  };
}

function mapNote(row: SheetRecord<'payment_notes'>): PaymentNote {
  return {
    id: row.id,
    payment_id: row.payment_id,
    note: row.note,
    created_by_user_id: asNullableString(row.created_by_user_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPayments(filters: ListPaymentsFilters = {}) {
  const rows = await readTable('payments');

  return rows
    .map(mapPayment)
    .filter((payment) => {
      if (filters.status?.length && !filters.status.includes(payment.status)) return false;
      if (
        filters.paymentMethod?.length &&
        !filters.paymentMethod.includes(payment.paymentMethodKey || payment.paymentMethod)
      ) {
        return false;
      }
      if (filters.email && !payment.payerEmail.toLowerCase().includes(filters.email.toLowerCase()))
        return false;
      if (
        filters.paymentId &&
        !`${payment.id} ${payment.paymentIdGateway || ''}`
          .toLowerCase()
          .includes(filters.paymentId.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.externalReference &&
        !payment.items.some((item) =>
          `${item.slug} ${item.title}`
            .toLowerCase()
            .includes(filters.externalReference!.toLowerCase())
        )
      ) {
        return false;
      }
      if (filters.dateFrom && new Date(payment.createdAt) < new Date(filters.dateFrom))
        return false;
      if (filters.dateTo && new Date(payment.createdAt) > new Date(filters.dateTo)) return false;
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getPaymentById(paymentId: string) {
  const [paymentRows, eventRows, noteRows] = await Promise.all([
    readTable('payments'),
    readTable('payment_events'),
    readTable('payment_notes'),
  ]);

  const paymentRow = paymentRows.find(
    (row) => row.id === paymentId || row.external_payment_id === paymentId
  );
  if (!paymentRow) return null;

  return {
    payment: mapPayment(paymentRow),
    events: eventRows.filter((row) => row.payment_id === paymentRow.id).map(mapEvent),
    notes: noteRows
      .filter((row) => row.payment_id === paymentRow.id)
      .map(mapNote)
      .sort((left, right) => right.created_at.localeCompare(left.created_at)),
  };
}

export async function addPaymentNote(
  paymentId: string,
  note: string,
  createdByUserId?: string | null
) {
  const trimmed = note.trim();
  if (!trimmed) {
    throw new ApiError(400, 'Payment note is required');
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  const rows = await mutateTable('payment_notes', async (current) => [
    ...current,
    {
      id,
      payment_id: paymentId,
      note: trimmed,
      created_by_user_id: createdByUserId ?? '',
      created_at: now,
      updated_at: now,
    },
  ]);

  return mapNote(rows.find((row) => row.id === id)!);
}

async function addPaymentEvents(
  paymentId: string,
  eventTypes: string[],
  payload: Record<string, unknown>
) {
  const createdAt = nowIso();
  await mutateTable('payment_events', async (current) => [
    ...current,
    ...eventTypes.map((type) => ({
      id: crypto.randomUUID(),
      payment_id: paymentId,
      type,
      date_created: createdAt,
      payload_json: toJsonString(payload),
    })),
  ]);
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

function asFiniteNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePaymentStatus(status: string | null | undefined): PaymentStatus {
  switch ((status || '').trim()) {
    case 'approved':
      return 'approved';
    case 'pending':
      return 'pending';
    case 'in_process':
      return 'in_process';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
    case 'cancelled_by_user':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'charged_back':
      return 'charged_back';
    default:
      return 'pending';
  }
}

function normalizePaymentMethodId(
  method: string | null | undefined
): string {
  const normalized = (method || '').trim().toLowerCase();
  if (!normalized || normalized === 'pending') return 'pending';
  if (normalized === 'pix') return 'pix';
  if (normalized === 'bolbradesco' || normalized === 'pec' || normalized === 'boleto')
    return 'boleto';
  return 'credit_card';
}

function normalizePaymentTypeId(
  type: string | null | undefined
): string {
  const normalized = (type || '').trim().toLowerCase();
  if (!normalized || normalized === 'pending') return 'pending';
  if (normalized === 'ticket') return 'ticket';
  if (normalized === 'credit_card') return 'credit_card';
  return 'account_money';
}

function buildMercadoPagoEventType(notification: MercadoPagoPayload, status: PaymentStatus) {
  const action = asText(notification.action);
  if (action) return action;

  const topic = asText(notification.type) || asText(notification.topic);
  if (topic) {
    return `${topic}.${status}`;
  }

  return `payment.${status}`;
}

async function resolveRecipeFromMercadoPagoPayment(payment: MercadoPagoPayload) {
  const metadata = asRecord(payment.metadata) ?? {};
  const recipeId = asText(metadata.recipe_id);
  if (recipeId) {
    const recipe = await getRecipeById(recipeId, { includeDrafts: true });
    if (recipe) return recipe;
  }

  const externalReference = asText(payment.external_reference);
  if (externalReference) {
    const recipe = await getRecipeBySlug(externalReference, { includeDrafts: true });
    if (recipe) return recipe;
  }

  return null;
}

async function resolveRecipesByIds(recipeIds: string[]) {
  const uniqueIds = [...new Set(recipeIds.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) {
    return [];
  }

  const resolved = await Promise.all(
    uniqueIds.map((recipeId) => getRecipeById(recipeId, { includeDrafts: true }))
  );

  return resolved.filter((recipe): recipe is Recipe => Boolean(recipe));
}

async function resolveRecipesFromMercadoPagoPayment(
  payment: MercadoPagoPayload,
  existingRow?: SheetRecord<'payments'>
) {
  const metadata = asRecord(payment.metadata) ?? {};
  const recipeIdsFromMetadata = asJson<string[]>(asText(metadata.recipe_ids_json) || '', []);
  if (recipeIdsFromMetadata.length > 0) {
    const recipes = await resolveRecipesByIds(recipeIdsFromMetadata);
    if (recipes.length > 0) {
      return recipes;
    }
  }

  if (existingRow) {
    const existingRecipeIds = getPaymentRecipeIds(existingRow, getPaymentItems(existingRow));
    const recipes = await resolveRecipesByIds(existingRecipeIds);
    if (recipes.length > 0) {
      return recipes;
    }
  }

  const singleRecipe = await resolveRecipeFromMercadoPagoPayment(payment);
  return singleRecipe ? [singleRecipe] : [];
}

function toPaymentItemsFromRecipes(recipes: Recipe[]) {
  return recipes.map((recipe) => buildCartItemFromRecipe(recipe));
}

function asRoundedBRL(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeCheckoutItems(inputItems: CartItem[] | undefined, recipes: Recipe[]) {
  if (!inputItems?.length || inputItems.length !== recipes.length) {
    return toPaymentItemsFromRecipes(recipes);
  }

  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  return inputItems.map((item) => {
    const recipe = recipesById.get(item.recipeId);
    if (!recipe) {
      throw new ApiError(400, `Checkout item inválido: ${item.recipeId}`);
    }

    const expectedPrice = asRoundedBRL(recipe.priceBRL ?? 0);
    const receivedPrice = asRoundedBRL(Number(item.priceBRL ?? 0));
    if (Math.abs(receivedPrice - expectedPrice) > 0.009) {
      throw new ApiError(
        409,
        `Preço divergente para ${recipe.title}. Atualize o carrinho e tente novamente.`,
      );
    }

    return buildCartItemFromRecipe(recipe);
  });
}

async function resolveRecipeSlugsFromPaymentData(input: {
  recipeIds: string[];
  items: CartItem[];
}) {
  const slugsFromItems = input.items.map((item) => item.slug).filter(Boolean);
  if (slugsFromItems.length > 0) {
    return [...new Set(slugsFromItems)];
  }

  const recipes = await resolveRecipesByIds(input.recipeIds);
  return recipes.map((recipe) => recipe.slug);
}

function buildPaymentRow(input: {
  id?: string;
  externalPaymentId?: string | null;
  provider: string;
  gateway: Payment['gateway'];
  recipeIds: string[];
  items: CartItem[];
  userId?: string | null;
  buyerEmail: string;
  payerName: string;
  status: PaymentStatus;
  statusDetail: string;
  paymentMethodId: string;
  paymentTypeId: string;
  checkoutReference: string;
  totalBRL: number;
  rawJson: Record<string, unknown> | null;
  externalReference: string;
  idempotencyKey: string;
  createdAt?: string;
  approvedAt?: string | null;
  webhookReceivedAt?: string | null;
}) {
  const now = nowIso();
  return {
    id: input.id || crypto.randomUUID(),
    payment_id_gateway: input.externalPaymentId || '',
    external_payment_id: input.externalPaymentId || '',
    provider: input.provider,
    gateway: input.gateway,
    recipe_id: input.recipeIds[0] || '',
    recipe_ids_json: toJsonString(input.recipeIds),
    item_snapshots_json: toJsonString(input.items),
    user_id: input.userId ?? '',
    buyer_email: input.buyerEmail,
    payer_name: input.payerName,
    payer_email: input.buyerEmail,
    status: input.status,
    status_detail: input.statusDetail,
    payment_method_id: input.paymentMethodId,
    payment_method: input.paymentMethodId,
    payment_type_id: input.paymentTypeId,
    payment_type: input.paymentTypeId,
    transaction_amount: String(input.totalBRL),
    total_brl: String(input.totalBRL),
    currency_id: 'BRL',
    date_created: input.createdAt || now,
    created_at: input.createdAt || now,
    date_approved: input.approvedAt || '',
    approved_at: input.approvedAt || '',
    updated_at: now,
    raw_json: toJsonString(input.rawJson),
    external_reference: input.externalReference,
    checkout_reference: input.checkoutReference,
    webhook_received_at: input.webhookReceivedAt || '',
    idempotency_key: input.idempotencyKey,
  } satisfies SheetRecord<'payments'>;
}

export async function syncMercadoPagoPayment(
  paymentPayload: MercadoPagoPayload,
  notificationPayload: MercadoPagoPayload
) {
  const externalPaymentId = asText(paymentPayload.id);
  if (!externalPaymentId) {
    throw new ApiError(400, 'Mercado Pago payment payload is missing an id');
  }

  const payer = asRecord(paymentPayload.payer) ?? {};
  const metadata = asRecord(paymentPayload.metadata) ?? {};
  const checkoutReference =
    asText(metadata.checkout_reference) ||
    asText(paymentPayload.external_reference) ||
    asText(paymentPayload.order_id) ||
    asText(asRecord(paymentPayload.order)?.id) ||
    '';
  const existingRows = await readTable('payments');
  const existing = existingRows.find(
    (row) =>
      row.external_payment_id === externalPaymentId ||
      row.idempotency_key === `mp:${externalPaymentId}` ||
      (checkoutReference && row.checkout_reference === checkoutReference)
  );
  const recipes = await resolveRecipesFromMercadoPagoPayment(paymentPayload, existing);
  const buyerEmail = asText(payer.email)?.toLowerCase() || '';
  const payerName =
    asText((payer as Record<string, unknown>).first_name) ||
    asText(metadata.payer_name) ||
    buyerEmail.split('@')[0] ||
    'Cliente';
  const user = buyerEmail ? await findOrCreateUserByEmail(buyerEmail) : null;
  const itemsFromMetadata = asJson<CartItem[]>(asText(metadata.item_snapshots_json) || '', []);
  const items =
    itemsFromMetadata.length > 0
      ? itemsFromMetadata
      : recipes.length > 0
        ? toPaymentItemsFromRecipes(recipes)
        : existing
          ? getPaymentItems(existing)
          : [];
  const recipeIdsFromMetadata = asJson<string[]>(asText(metadata.recipe_ids_json) || '', []);
  const recipeIds =
    recipes.length > 0
      ? recipes.map((recipe) => recipe.id)
      : recipeIdsFromMetadata.length > 0
        ? recipeIdsFromMetadata
        : existing
          ? getPaymentRecipeIds(existing, items)
          : [];
  const externalReference =
    asText(paymentPayload.external_reference) || existing?.external_reference || checkoutReference;
  const status = normalizePaymentStatus(asText(paymentPayload.status));
  const statusDetail = asText(paymentPayload.status_detail) || status;
  const totalBRL =
    asFiniteNumber(paymentPayload.transaction_amount) ?? sumBRL(items.map((item) => item.priceBRL));
  const createdAt = asText(paymentPayload.date_created) || nowIso();
  const approvedAt =
    status === 'approved'
      ? asText(paymentPayload.date_approved) || asText(paymentPayload.date_last_updated) || nowIso()
      : null;
  const webhookReceivedAt = nowIso();
  const idempotencyKey = `mp:${externalPaymentId}`;

  const rows = await mutateTable('payments', async (current) => {
    const currentExisting = current.find(
      (row) =>
        row.external_payment_id === externalPaymentId ||
        row.idempotency_key === idempotencyKey ||
        (checkoutReference && row.checkout_reference === checkoutReference)
    );

    const nextRow = buildPaymentRow({
      id: currentExisting?.id || existing?.id,
      externalPaymentId,
      provider: 'mercadopago',
      gateway: 'mercado_pago',
      recipeIds:
        recipeIds.length > 0
          ? recipeIds
          : currentExisting
            ? getPaymentRecipeIds(currentExisting, getPaymentItems(currentExisting))
            : existing
              ? getPaymentRecipeIds(existing, getPaymentItems(existing))
              : [],
      items:
        items.length > 0
          ? items
          : currentExisting
            ? getPaymentItems(currentExisting)
            : existing
              ? getPaymentItems(existing)
              : [],
      userId: user?.id || currentExisting?.user_id || existing?.user_id || '',
      buyerEmail: buyerEmail || currentExisting?.buyer_email || existing?.buyer_email || '',
      payerName,
      status,
      statusDetail,
      paymentMethodId: normalizePaymentMethodId(asText(paymentPayload.payment_method_id)),
      paymentTypeId: normalizePaymentTypeId(asText(paymentPayload.payment_type_id)),
      checkoutReference:
        checkoutReference ||
        currentExisting?.checkout_reference ||
        existing?.checkout_reference ||
        '',
      totalBRL:
        totalBRL ||
        asNumber(currentExisting?.total_brl || currentExisting?.transaction_amount) ||
        asNumber(existing?.total_brl || existing?.transaction_amount),
      rawJson: paymentPayload,
      externalReference:
        externalReference ||
        currentExisting?.external_reference ||
        existing?.external_reference ||
        '',
      idempotencyKey:
        currentExisting?.idempotency_key || existing?.idempotency_key || idempotencyKey,
      createdAt:
        currentExisting?.created_at ||
        currentExisting?.date_created ||
        existing?.created_at ||
        existing?.date_created ||
        createdAt,
      approvedAt:
        approvedAt ||
        currentExisting?.approved_at ||
        currentExisting?.date_approved ||
        existing?.approved_at ||
        existing?.date_approved ||
        null,
      webhookReceivedAt,
    });

    if (currentExisting) {
      return current.map((row) => (row.id === currentExisting.id ? nextRow : row));
    }

    if (existing) {
      return current.map((row) => (row.id === existing.id ? nextRow : row));
    }

    return [...current, nextRow];
  });

  const payment = mapPayment(
    rows.find(
      (row) =>
        row.external_payment_id === externalPaymentId || row.idempotency_key === idempotencyKey
    )!
  );

  await addPaymentEvents(
    payment.id,
    [buildMercadoPagoEventType(notificationPayload, payment.status)],
    {
      notification: notificationPayload,
      payment: paymentPayload,
    }
  );

  if (payment.status === 'approved' && payment.recipeIds.length > 0 && payment.payerEmail) {
    const recipeSlugs = await resolveRecipeSlugsFromPaymentData({
      recipeIds: payment.recipeIds,
      items: payment.items,
    });

    for (const recipeSlug of recipeSlugs) {
      await createEntitlement({
        paymentId: payment.id,
        payerEmail: payment.payerEmail,
        recipeSlug,
      });
    }
  }

  if (['cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
    await revokeEntitlement(payment.id);
  }

  return payment;
}

export async function createMockCheckout(input: {
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  userId?: string | null;
  checkoutReference: string;
}) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  if (!buyerEmail) {
    throw new ApiError(400, 'Buyer email is required');
  }

  if (!input.recipeIds.length) {
    throw new ApiError(400, 'At least one recipe is required for checkout');
  }

  const recipes: Recipe[] = [];
  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(recipeId, { includeDrafts: true });
    if (!recipe) {
      throw new ApiError(404, `Recipe not found for checkout: ${recipeId}`);
    }

    if (recipe.accessTier !== 'paid' || !recipe.priceBRL) {
      throw new ApiError(400, `Recipe ${recipe.title} is not eligible for paid checkout`);
    }

    recipes.push(recipe);
  }

  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));
  const payerName = input.payerName?.trim() || buyerEmail.split('@')[0] || 'Cliente';
  const idempotencyKey = input.checkoutReference;

  const rows = await mutateTable('payments', async (current) => {
    const existing = current.find((row) => row.idempotency_key === idempotencyKey);
    if (existing) {
      return current;
    }

    return [
      ...current,
      buildPaymentRow({
        provider: 'mock',
        gateway: 'mock',
        recipeIds: recipes.map((recipe) => recipe.id),
        items,
        userId: input.userId,
        buyerEmail,
        payerName,
        status: 'approved',
        statusDetail: 'accredited',
        paymentMethodId: 'pix',
        paymentTypeId: 'account_money',
        checkoutReference: input.checkoutReference,
        totalBRL,
        rawJson: {
          provider: 'mock',
          checkoutReference: input.checkoutReference,
          recipeIds: recipes.map((recipe) => recipe.id),
          totalBRL,
        },
        externalReference: items[0]?.slug || recipes[0]?.slug || '',
        idempotencyKey,
        approvedAt: nowIso(),
      }),
    ];
  });

  const created = rows.find((row) => row.idempotency_key === idempotencyKey)!;
  await addPaymentEvents(created.id, ['checkout.created', 'payment.approved'], {
    provider: 'mock',
    recipeIds: recipes.map((recipe) => recipe.id),
    buyerEmail,
    totalBRL,
  });

  for (const recipe of recipes) {
    await createEntitlement({
      paymentId: created.id,
      payerEmail: buyerEmail,
      recipeSlug: recipe.slug,
    });
  }

  const payment = mapPayment(created);
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

function appendQuery(
  url: string,
  params: Record<string, string | number | boolean | undefined | null>
) {
  const next = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    next.searchParams.set(key, String(value));
  });
  return next.toString();
}

function extractInitPoint(rawJson: Record<string, unknown> | null) {
  const preference = asRecord(rawJson?.preference);
  return asText(preference?.init_point);
}

function extractSandboxInitPoint(rawJson: Record<string, unknown> | null) {
  const preference = asRecord(rawJson?.preference);
  return asText(preference?.sandbox_init_point);
}

export async function createMercadoPagoCheckout(input: {
  recipeIds: string[];
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  userId?: string | null;
  checkoutReference: string;
  baseUrl: string;
  enableNotifications: boolean;
}) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  if (!buyerEmail) {
    throw new ApiError(400, 'Buyer email is required');
  }

  if (!input.recipeIds.length) {
    throw new ApiError(400, 'At least one recipe is required for checkout');
  }

  const existingRows = await readTable('payments');
  const existing = existingRows.find((row) => row.idempotency_key === input.checkoutReference);
  if (existing) {
    const payment = mapPayment(existing);
    return {
      payment,
      payments: [payment],
      gateway: payment.gateway,
      paymentId: payment.id,
      primaryPaymentId: payment.id,
      paymentIds: [payment.id],
      status: payment.status,
      unlockedCount: payment.status === 'approved' ? payment.recipeIds.length : 0,
      preferenceId: asText(asRecord(asRecord(asJson<Record<string, unknown> | null>(existing.raw_json, null))?.preference)?.id),
      initPoint: extractInitPoint(asJson<Record<string, unknown> | null>(existing.raw_json, null)),
      sandboxInitPoint: extractSandboxInitPoint(asJson<Record<string, unknown> | null>(existing.raw_json, null)),
    };
  }

  const recipes: Recipe[] = [];
  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(recipeId, { includeDrafts: true });
    if (!recipe) {
      throw new ApiError(404, `Recipe not found for checkout: ${recipeId}`);
    }

    if (recipe.accessTier !== 'paid' || !recipe.priceBRL) {
      throw new ApiError(400, `Recipe ${recipe.title} is not eligible for paid checkout`);
    }

    recipes.push(recipe);
  }

  const items = normalizeCheckoutItems(input.items, recipes);
  const totalBRL = sumBRL(items.map((item) => item.priceBRL));
  const payerName = input.payerName?.trim() || buyerEmail.split('@')[0] || 'Cliente';
  const slug = items.length === 1 ? items[0].slug : '';
  const basePath = input.baseUrl.replace(/\/+$/, '');
  const metadata = {
    checkout_reference: input.checkoutReference,
    recipe_ids_json: JSON.stringify(recipes.map((recipe) => recipe.id)),
    recipe_slugs_json: JSON.stringify(items.map((item) => item.slug)),
    item_snapshots_json: JSON.stringify(items),
    buyer_email: buyerEmail,
    payer_name: payerName,
  };
  const notificationUrl = input.enableNotifications
    ? `${basePath}/api/payments/mercadopago/webhook`
    : undefined;

  const preference = await createMercadoPagoPreference({
    items,
    buyerEmail,
    externalReference: input.checkoutReference,
    successUrl: appendQuery(`${basePath}/compra/sucesso`, {
      slug,
      count: recipes.length,
      checkout_reference: input.checkoutReference,
    }),
    pendingUrl: appendQuery(`${basePath}/compra/pendente`, {
      slug,
      count: recipes.length,
      checkout_reference: input.checkoutReference,
    }),
    failureUrl: appendQuery(`${basePath}/compra/falha`, {
      slug,
      count: recipes.length,
      checkout_reference: input.checkoutReference,
    }),
    notificationUrl,
    metadata,
  });

  const createdRows = await mutateTable('payments', async (current) => [
    ...current,
    buildPaymentRow({
      externalPaymentId: null,
      provider: 'mercadopago',
      gateway: 'mercado_pago',
      recipeIds: recipes.map((recipe) => recipe.id),
      items,
      userId: input.userId,
      buyerEmail,
      payerName,
      status: 'pending',
      statusDetail: 'waiting_checkout',
      paymentMethodId: 'pending',
      paymentTypeId: 'pending',
      checkoutReference: input.checkoutReference,
      totalBRL,
      rawJson: {
        preference,
        metadata,
      },
      externalReference: input.checkoutReference,
      idempotencyKey: input.checkoutReference,
    }),
  ]);

  const created = createdRows.find((row) => row.idempotency_key === input.checkoutReference)!;
  await addPaymentEvents(created.id, ['checkout.preference_created'], {
    provider: 'mercadopago',
    checkoutReference: input.checkoutReference,
    preferenceId: preference.preferenceId,
    initPoint: preference.initPoint,
    buyerEmail,
    totalBRL,
    notificationsEnabled: Boolean(notificationUrl),
  });

  const payment = mapPayment(created);
  return {
    payment,
    payments: [payment],
    gateway: payment.gateway,
    paymentId: payment.id,
    primaryPaymentId: payment.id,
    paymentIds: [payment.id],
    status: payment.status,
    unlockedCount: 0,
    preferenceId: preference.preferenceId,
    initPoint: preference.initPoint,
    sandboxInitPoint: preference.sandboxInitPoint,
  };
}
