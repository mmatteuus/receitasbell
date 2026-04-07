# PATCH — `src/server/payments/repo.ts`

Aplicar as mudanças abaixo no arquivo alvo.

## 1. Ajustar tipos

```ts
export interface PaymentMetadata {
  payerEmail?: string;
  payerName?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  userId?: string | null;
  amount: number; // centavos
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  providerPaymentId: string;
  mpPaymentId: string;
  preferenceId: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider: string;
  recipeIds: string[];
  items: CartItem[];
  metadata?: PaymentMetadata | null;
  providerEventId?: string | null;
  providerMetadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

type PaymentOrderRow = {
  id: string;
  tenant_id: string | number;
  user_id?: string | null;
  amount_cents: number | string;
  currency: string;
  status: string;
  external_reference?: string | null;
  provider_payment_id?: string | null;
  mp_payment_id?: string | null;
  preference_id?: string | null;
  idempotency_key?: string | null;
  payment_method?: string | null;
  provider?: string | null;
  recipe_ids?: string[] | null;
  items?: CartItem[] | null;
  metadata?: Record<string, unknown> | null;
  provider_event_id?: string | null;
  provider_metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
```

## 2. `createPaymentOrder()`

Trocar o insert para:

```ts
.insert({
  tenant_id: tenantId,
  user_id: input.userId || null,
  amount_cents: input.amount,
  currency: input.currency || 'BRL',
  status: input.status,
  external_reference: input.externalReference,
  idempotency_key: input.idempotencyKey,
  payment_method: input.paymentMethod,
  provider: input.provider || 'stripe',
  recipe_ids: input.recipeIds,
  items: input.items,
  metadata: {
    payerEmail: input.payerEmail.toLowerCase().trim(),
    userId: input.userId || '',
  },
})
```

## 3. `updatePaymentOrderInternal()`

Adicionar ao contrato:

```ts
metadata?: PaymentMetadata | null;
providerEventId?: string | null;
providerMetadata?: Record<string, unknown> | null;
```

E mapear:

```ts
if (updates.metadata !== undefined) rowUpdates.metadata = updates.metadata;
if (updates.providerEventId !== undefined) rowUpdates.provider_event_id = updates.providerEventId;
if (updates.providerMetadata !== undefined)
  rowUpdates.provider_metadata_json = updates.providerMetadata;
```

## 4. `listPayments()`

Remover filtro SQL por `payer_email`.

Em vez disso, filtrar depois do `mapPaymentRecordToAdminPayment()`:

```ts
.filter((payment) => matchesPaymentFilters(payment, filters));
```

E em `matchesPaymentFilters()` adicionar:

```ts
if (filters.email && !payment.payerEmail.toLowerCase().includes(filters.email.toLowerCase())) {
  return false;
}
```

## 5. `mapRowToPayment()`

Substituir por lógica equivalente a:

```ts
function mapRowToPayment(row: PaymentOrderRow): PaymentRecord {
  const metadata =
    row.metadata && typeof row.metadata === 'object' ? (row.metadata as PaymentMetadata) : {};

  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    userId: row.user_id ? String(row.user_id) : null,
    amount: Number(row.amount_cents || 0),
    currency: row.currency,
    status: row.status as PaymentStatus,
    externalReference: row.external_reference || '',
    providerPaymentId: row.provider_payment_id || row.mp_payment_id || '',
    mpPaymentId: row.mp_payment_id || '',
    preferenceId: row.preference_id || '',
    idempotencyKey: row.idempotency_key || '',
    payerEmail: typeof metadata.payerEmail === 'string' ? metadata.payerEmail : '',
    paymentMethod: row.payment_method || '',
    provider: row.provider || 'stripe',
    recipeIds: Array.isArray(row.recipe_ids) ? row.recipe_ids.map(String) : [],
    items: Array.isArray(row.items) ? row.items : [],
    metadata,
    providerEventId: row.provider_event_id || null,
    providerMetadata:
      row.provider_metadata_json && typeof row.provider_metadata_json === 'object'
        ? row.provider_metadata_json
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

## 6. `mapPaymentRecordToAdminPayment()`

Trocar:

```ts
totalBRL: payment.amount,
```

por:

```ts
totalBRL: Number((payment.amount / 100).toFixed(2)),
```

E usar `payerName` assim:

```ts
payerName:
  typeof payment.metadata?.payerName === 'string' && payment.metadata.payerName.trim()
    ? payment.metadata.payerName.trim()
    : payment.payerEmail.split('@')[0] || 'cliente',
```

## 7. `getPaymentDetailById()`

Não retornar `events: []`.

Carregar de `payment_events`:

```ts
const { data: eventRows } = await supabaseAdmin
  .from('payment_events')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('payment_order_id', order.id)
  .order('created_at', { ascending: false });
```

Mapear para `PaymentEvent[]`.

---

## Teste mínimo

```bash
npm run lint && npm run typecheck && npm run build
```
