import type { CartItem } from "../../types/cart.js";
import type { Entitlement as AppEntitlement } from "../../types/entitlement.js";
import type { Payment as AdminPayment, PaymentEvent, PaymentNote } from "../../lib/payments/types.js";
import type { PaymentStatus as AppPaymentStatus } from "../../types/payment.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import { listEntitlementsByEmail, type Entitlement as ServerEntitlement } from "../identity/entitlements.repo.js";
import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";
import { listRecipes } from "../recipes/repo.js";

export type PaymentStatus =
  | "created"
  | "pending"
  | "in_process"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "chargeback"
  | "charged_back"
  | "failed";

export type PaymentListFilters = {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  paymentIdGateway?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
  from?: string;
  to?: string;
};

type PaymentItem = {
  recipeSlug?: string;
  recipeId?: string;
  title?: string;
  slug?: string;
  imageUrl?: string | null;
  priceBRL?: number | string;
  quantity?: number | string;
  [key: string]: unknown;
};

type PaymentOrderRow = {
  id?: string | number;
  tenant_id?: string | number;
  user_id?: string | number;
  amount?: string | number;
  currency?: string;
  status?: string;
  external_reference?: string;
  mp_payment_id?: string;
  preference_id?: string;
  idempotency_key?: string;
  payer_email?: string;
  payment_method?: string;
  provider?: string;
  recipe_ids_json?: string;
  items_json?: string;
  created_at?: string;
  updated_at?: string;
};

type PaymentEventRow = {
  id?: string | number;
  x_request_id?: string;
  mp_payment_id?: string;
  event_data_id?: string;
  raw_json?: string | null;
  created_at?: string;
};

type AuditLogRow = {
  id?: string | number;
  actor_type?: string;
  actor_id?: string | number;
  tenant_id?: string | number;
  action?: string;
  resource_type?: string;
  resource_id?: string | number;
  payload?: string | null;
  ip?: string;
  user_agent?: string;
  created_at?: string;
};

export interface PaymentRecord {
  id: string | number;
  tenantId: string;
  userId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  mpPaymentId: string;
  preferenceId: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider: string;
  recipeIds: string[];
  items: PaymentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetailRecord {
  payment: AdminPayment;
  events: PaymentEvent[];
  notes: PaymentNote[];
  recipes: RecipeRecord[];
  entitlements: AppEntitlement[];
}

type CreatePaymentNoteInput = {
  tenantId: string | number;
  paymentId: string | number;
  note: string;
  actorType: "admin" | "system";
  actorId: string;
  ip?: string;
  userAgent?: string;
};

const DEFAULT_PAGE_SIZE = 200;
const PAYMENT_NOTE_ACTION = "payment.note_added";

export async function createPaymentOrder(
  tenantId: string,
  input: {
    userId?: string | null;
    amount: number;
    currency?: string;
    status: PaymentStatus;
    externalReference: string;
    idempotencyKey: string;
    payerEmail: string;
    paymentMethod: string;
    provider?: string;
    recipeIds: string[];
    items: PaymentItem[];
  },
): Promise<PaymentRecord> {
  const now = new Date().toISOString();
  const record = await baserowFetch<PaymentOrderRow>(
    `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        user_id: input.userId || "",
        amount: input.amount,
        currency: input.currency || "BRL",
        status: input.status,
        external_reference: input.externalReference,
        idempotency_key: input.idempotencyKey,
        payer_email: input.payerEmail,
        payment_method: input.paymentMethod,
        provider: input.provider || "mercadopago",
        recipe_ids_json: JSON.stringify(input.recipeIds),
        items_json: JSON.stringify(input.items),
        created_at: now,
        updated_at: now,
      }),
    },
  );
  return mapRowToPayment(record);
}

export async function getPaymentOrderById(
  tenantId: string | number,
  id: string | number,
): Promise<PaymentRecord | null> {
  try {
    const row = await baserowFetch<PaymentOrderRow>(
      `/api/database/rows/table/${baserowTables.paymentOrders}/${id}/?user_field_names=true`,
    );
    if (String(row.tenant_id) !== String(tenantId)) return null;
    return mapRowToPayment(row);
  } catch {
    return null;
  }
}

export async function getPaymentOrderByExternalReference(
  tenantId: string,
  externalReference: string,
): Promise<PaymentRecord | null> {
  const data = await baserowFetch<{ results: PaymentOrderRow[] }>(
    `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__tenant_id__equal=${encodeURIComponent(tenantId)}&filter__external_reference__equal=${encodeURIComponent(externalReference)}`,
  );
  const row = data.results[0];
  return row ? mapRowToPayment(row) : null;
}

export async function updatePaymentOrderStatus(
  tenantId: string,
  id: string | number,
  status: string,
  mpPaymentId?: string,
): Promise<void> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (mpPaymentId) payload.mp_payment_id = mpPaymentId;

  await baserowFetch(`/api/database/rows/table/${baserowTables.paymentOrders}/${id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function setPaymentOrderExternalReference(
  tenantId: string,
  id: string | number,
  externalReference: string,
): Promise<void> {
  await baserowFetch(`/api/database/rows/table/${baserowTables.paymentOrders}/${id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({
      external_reference: externalReference,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function listPayments(
  tenantId: string | number,
  filters: PaymentListFilters = {},
): Promise<AdminPayment[]> {
  const rows = await listRowsByTable<PaymentOrderRow>(baserowTables.paymentOrders, [
    `filter__tenant_id__equal=${encodeURIComponent(String(tenantId))}`,
    "order_by=-created_at,-id",
  ]);
  const orders = rows.map(mapRowToPayment);
  const recipeIndex = await buildRecipeIndex(tenantId, orders);

  return orders
    .map((order) => mapPaymentRecordToAdminPayment(order, recipeIndex))
    .filter((payment) => matchesPaymentFilters(payment, filters))
    .sort(comparePaymentsByNewest);
}

export async function getPaymentById(
  tenantId: string | number,
  id: string | number,
): Promise<AdminPayment | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;
  const recipeIndex = await buildRecipeIndex(tenantId, [order]);
  return mapPaymentRecordToAdminPayment(order, recipeIndex);
}

export async function getPaymentDetailById(
  tenantId: string | number,
  id: string | number,
): Promise<PaymentDetailRecord | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;

  const recipeIndex = await buildRecipeIndex(tenantId, [order]);
  const [events, notes, entitlements] = await Promise.all([
    listPaymentEvents(order),
    listPaymentNotes(tenantId, order.id),
    listEntitlementsByEmail(tenantId, order.payerEmail),
  ]);

  const payment = mapPaymentRecordToAdminPayment(order, recipeIndex, events);
  const recipes = order.recipeIds
    .map((recipeId) => recipeIndex.get(String(recipeId)))
    .filter((recipe): recipe is RecipeRecord => Boolean(recipe));

  return {
    payment,
    events,
    notes,
    recipes,
    entitlements: entitlements
      .filter((entitlement) => String(entitlement.paymentId) === String(order.id))
      .map(mapEntitlementToAppEntitlement),
  };
}

export async function createPaymentNote(input: CreatePaymentNoteInput): Promise<PaymentNote> {
  const payment = await getPaymentOrderById(input.tenantId, input.paymentId);
  if (!payment) {
    throw new Error(`Payment ${input.paymentId} not found for tenant ${input.tenantId}`);
  }

  const now = new Date().toISOString();
  const row = await baserowFetch<AuditLogRow>(
    `/api/database/rows/table/${baserowTables.auditLogs}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        actor_type: input.actorType,
        actor_id: input.actorId,
        tenant_id: String(input.tenantId),
        action: PAYMENT_NOTE_ACTION,
        resource_type: "payment_order",
        resource_id: String(input.paymentId),
        payload: JSON.stringify({ note: input.note }),
        ip: input.ip || "",
        user_agent: input.userAgent || "",
        created_at: now,
      }),
    },
  );

  return mapAuditLogRowToPaymentNote(row, input.paymentId);
}

async function listPaymentEvents(payment: PaymentRecord): Promise<PaymentEvent[]> {
  if (!payment.mpPaymentId) return [];

  const rows = await listRowsByTable<PaymentEventRow>(baserowTables.paymentEvents, [
    `filter__mp_payment_id__equal=${encodeURIComponent(payment.mpPaymentId)}`,
    "order_by=-created_at,-id",
  ]);

  return rows
    .map((row) => mapPaymentEventRow(payment.id, row))
    .sort((a, b) => compareDatesDesc(a.date_created, b.date_created));
}

async function listPaymentNotes(
  tenantId: string | number,
  paymentId: string | number,
): Promise<PaymentNote[]> {
  const rows = await listRowsByTable<AuditLogRow>(baserowTables.auditLogs, [
    `filter__tenant_id__equal=${encodeURIComponent(String(tenantId))}`,
    `filter__resource_type__equal=${encodeURIComponent("payment_order")}`,
    `filter__resource_id__equal=${encodeURIComponent(String(paymentId))}`,
    "order_by=-created_at,-id",
  ]);

  return rows
    .filter((row) => row.action === PAYMENT_NOTE_ACTION)
    .map((row) => mapAuditLogRowToPaymentNote(row, paymentId))
    .filter((note) => Boolean(note.note))
    .sort((a, b) => compareDatesDesc(a.created_at, b.created_at));
}

async function buildRecipeIndex(
  tenantId: string | number,
  payments: PaymentRecord[],
): Promise<Map<string, RecipeRecord>> {
  const uniqueRecipeIds = new Set<string>();

  for (const payment of payments) {
    for (const recipeId of payment.recipeIds) {
      if (recipeId) uniqueRecipeIds.add(String(recipeId));
    }
    for (const item of payment.items) {
      if (item.recipeId) uniqueRecipeIds.add(String(item.recipeId));
    }
  }

  if (uniqueRecipeIds.size === 0) return new Map();

  const recipes = await listRecipes(tenantId, {
    includeDrafts: true,
    ids: [...uniqueRecipeIds],
  });

  return new Map(recipes.map((recipe) => [String(recipe.id), recipe]));
}

function mapRowToPayment(row: PaymentOrderRow): PaymentRecord {
  return {
    id: row.id ?? "",
    tenantId: String(row.tenant_id ?? ""),
    userId: row.user_id ? String(row.user_id) : null,
    amount: Number(row.amount || 0),
    currency: row.currency || "BRL",
    status: normalizeStoredStatus(row.status),
    externalReference: row.external_reference || "",
    mpPaymentId: row.mp_payment_id || "",
    preferenceId: row.preference_id || "",
    idempotencyKey: row.idempotency_key || "",
    payerEmail: (row.payer_email || "").trim().toLowerCase(),
    paymentMethod: row.payment_method || "",
    provider: row.provider || "mercadopago",
    recipeIds: parseJsonArray(row.recipe_ids_json).map((value) => String(value)),
    items: parseJsonArray(row.items_json) as PaymentItem[],
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || row.created_at || "",
  };
}

function mapPaymentRecordToAdminPayment(
  payment: PaymentRecord,
  recipeIndex: Map<string, RecipeRecord>,
  events: PaymentEvent[] = [],
): AdminPayment {
  const status = normalizeAppPaymentStatus(payment.status);
  const paymentMethodKey = normalizePaymentMethodKey(payment.paymentMethod);
  const items = mapPaymentItems(payment, recipeIndex);
  const latestEventDate = events[0]?.date_created || null;

  return {
    id: String(payment.id),
    paymentIdGateway: payment.mpPaymentId || "",
    gateway: normalizeGateway(payment.provider),
    recipeIds: payment.recipeIds.map((recipeId) => String(recipeId)),
    totalBRL: payment.amount,
    payerName: inferPayerName(payment.payerEmail),
    payerEmail: payment.payerEmail,
    payer: {
      email: payment.payerEmail,
    },
    status,
    statusDetail: describePaymentStatus(status, payment),
    paymentMethod: payment.paymentMethod || paymentMethodKey || "pending",
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    items,
    approvedAt: status === "approved" ? payment.updatedAt : null,
    paymentType: payment.paymentMethod || null,
    paymentMethodKey,
    checkoutReference: payment.externalReference || null,
    webhookReceivedAt: latestEventDate,
  };
}

function mapPaymentItems(
  payment: PaymentRecord,
  recipeIndex: Map<string, RecipeRecord>,
): CartItem[] {
  const fallbackItems: PaymentItem[] = payment.recipeIds.map((recipeId) => ({ recipeId }));
  const itemSource: PaymentItem[] = payment.items.length > 0 ? payment.items : fallbackItems;

  return itemSource.map((item) => {
    const recipe = item.recipeId ? recipeIndex.get(String(item.recipeId)) : undefined;
    const title = toNonEmptyString(item.title) || recipe?.title || toNonEmptyString(item.recipeSlug) || toNonEmptyString(item.recipeId) || "Receita";
    const slug = toNonEmptyString(item.slug) || toNonEmptyString(item.recipeSlug) || recipe?.slug || toNonEmptyString(item.recipeId) || String(payment.id);
    const imageUrl = typeof item.imageUrl === "string" ? item.imageUrl : recipe?.imageUrl || null;
    const priceFromItem = toNumber(item.priceBRL);
    return {
      recipeId: toNonEmptyString(item.recipeId) || recipe?.id || slug,
      title,
      slug,
      imageUrl,
      priceBRL: priceFromItem ?? recipe?.priceBRL ?? 0,
      quantity: toNumber(item.quantity) ?? 1,
    };
  });
}

function mapPaymentEventRow(paymentId: string | number, row: PaymentEventRow): PaymentEvent {
  const payload = parseJsonRecord(row.raw_json);
  const type = toNonEmptyString(payload.action)
    || toNonEmptyString(payload.type)
    || toNonEmptyString(row.event_data_id)
    || "mercadopago.webhook";

  return {
    id: String(row.id ?? ""),
    paymentId: String(paymentId),
    type,
    date_created: row.created_at || "",
    payload_json: payload,
  };
}

function mapAuditLogRowToPaymentNote(
  row: AuditLogRow,
  paymentId: string | number,
): PaymentNote {
  const payload = parseJsonRecord(row.payload);
  const createdBy = row.actor_type === "admin" && row.actor_id != null ? String(row.actor_id) : null;
  return {
    id: String(row.id ?? ""),
    payment_id: String(paymentId),
    note: toNonEmptyString(payload.note) || "",
    created_by_user_id: createdBy,
    created_at: row.created_at || "",
    updated_at: row.created_at || "",
  };
}

function mapEntitlementToAppEntitlement(entitlement: ServerEntitlement): AppEntitlement {
  return {
    id: String(entitlement.id),
    paymentId: String(entitlement.paymentId),
    payerEmail: entitlement.payerEmail,
    recipeSlug: entitlement.recipeSlug,
    accessStatus: entitlement.accessStatus === "revoked" ? "revoked" : "active",
    createdAt: entitlement.createdAt,
    updatedAt: entitlement.updatedAt,
  };
}

function normalizeStoredStatus(value: unknown): PaymentStatus {
  switch (String(value || "").toLowerCase()) {
    case "approved":
    case "pending":
    case "in_process":
    case "rejected":
    case "cancelled":
    case "refunded":
    case "chargeback":
    case "charged_back":
    case "failed":
      return String(value) as PaymentStatus;
    case "created":
    default:
      return "created";
  }
}

function normalizeAppPaymentStatus(value: PaymentStatus): AppPaymentStatus {
  switch (value) {
    case "approved":
      return "approved";
    case "in_process":
      return "in_process";
    case "rejected":
    case "failed":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "chargeback":
    case "charged_back":
      return "charged_back";
    case "created":
    case "pending":
    default:
      return "pending";
  }
}

function normalizeGateway(provider: string): "mercado_pago" | "mock" {
  return provider === "mock" ? "mock" : "mercado_pago";
}

function normalizePaymentMethodKey(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "credit-card":
    case "credit card":
      return "credit_card";
    case "mercadopago":
    case "mercado_pago":
    case "mercado pago":
    case "":
      return "pending";
    default:
      return normalized;
  }
}

function describePaymentStatus(status: AppPaymentStatus, payment: PaymentRecord) {
  switch (status) {
    case "approved":
      return payment.mpPaymentId
        ? `Pagamento aprovado e sincronizado (${payment.mpPaymentId}).`
        : "Pagamento aprovado e sincronizado.";
    case "in_process":
      return "Pagamento em processamento pelo provedor.";
    case "rejected":
      return "Pagamento rejeitado ou encerrado sem aprovacao.";
    case "cancelled":
      return "Pagamento cancelado.";
    case "refunded":
      return "Pagamento reembolsado.";
    case "charged_back":
      return "Pagamento marcado como chargeback.";
    case "pending":
    default:
      return payment.mpPaymentId
        ? "Pagamento criado e aguardando confirmacao do provedor."
        : "Checkout criado e aguardando confirmacao do pagamento.";
  }
}

function inferPayerName(email: string) {
  const localPart = email.split("@")[0] || "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  return cleaned || "Nao informado";
}

function matchesPaymentFilters(payment: AdminPayment, filters: PaymentListFilters) {
  const statuses = normalizeFilterList(filters.status);
  if (statuses.length > 0 && !statuses.includes(payment.status)) {
    return false;
  }

  const methods = normalizeFilterList(filters.paymentMethod);
  if (methods.length > 0) {
    const methodValues = new Set([
      payment.paymentMethodKey,
      String(payment.paymentMethod || "").trim().toLowerCase(),
    ]);
    if (!methods.some((method) => methodValues.has(method))) {
      return false;
    }
  }

  const email = normalizeSearchValue(filters.email);
  if (email && !payment.payerEmail.toLowerCase().includes(email)) {
    return false;
  }

  const paymentIdQuery = normalizeSearchValue(filters.paymentId || filters.paymentIdGateway);
  if (paymentIdQuery) {
    const candidates = [
      String(payment.id),
      String(payment.paymentIdGateway || ""),
      String(payment.checkoutReference || ""),
    ].map((value) => value.toLowerCase());
    if (!candidates.some((candidate) => candidate.includes(paymentIdQuery))) {
      return false;
    }
  }

  const externalReference = normalizeSearchValue(filters.externalReference);
  if (externalReference && !String(payment.checkoutReference || "").toLowerCase().includes(externalReference)) {
    return false;
  }

  const dateFrom = toTimestamp(filters.dateFrom || filters.from);
  if (dateFrom && toTimestamp(payment.createdAt) < dateFrom) {
    return false;
  }

  const dateTo = toTimestamp(filters.dateTo || filters.to);
  if (dateTo && toTimestamp(payment.createdAt) > dateTo) {
    return false;
  }

  return true;
}

function comparePaymentsByNewest(a: AdminPayment, b: AdminPayment) {
  return compareDatesDesc(a.createdAt, b.createdAt) || compareStringsDesc(a.id, b.id);
}

function compareDatesDesc(a: string, b: string) {
  return toTimestamp(b) - toTimestamp(a);
}

function compareStringsDesc(a: string, b: string) {
  return String(b).localeCompare(String(a), "pt-BR", { numeric: true, sensitivity: "base" });
}

function normalizeFilterList(value: string[] | undefined) {
  return (value || [])
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

function normalizeSearchValue(value: string | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toTimestamp(value: string | undefined | null) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNonEmptyString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

async function listRowsByTable<T>(tableId: number, queryParts: string[]): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;

  while (true) {
    const query = ["user_field_names=true", ...queryParts, `page=${page}`, `size=${DEFAULT_PAGE_SIZE}`].join("&");
    const data = await baserowFetch<{ results: T[]; next?: string | null }>(
      `/api/database/rows/table/${tableId}/?${query}`,
    );
    const batch = Array.isArray(data.results) ? data.results : [];
    if (batch.length === 0) break;
    rows.push(...batch);
    if (!data.next) break;
    page += 1;
  }

  return rows;
}
