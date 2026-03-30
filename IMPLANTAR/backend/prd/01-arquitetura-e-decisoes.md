# Arquitetura e decisões

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Objetivo de arquitetura
Transformar o domínio de pagamento em um módulo único, isolado, observável e reversível.

## Estrutura canônica
```text
src/server/payments/
  application/
    router.ts
    handlers/
      checkout-session-create.ts
      connect-account-create.ts
      connect-onboarding-link.ts
      connect-status-get.ts
      products-sync.ts
      webhook-stripe.ts
      reconcile-manual.ts
  core/
    types.ts
    enums.ts
    errors.ts
    idempotency.ts
    external-reference.ts
    status-map.ts
    feature-flags.ts
  providers/
    stripe/
      client.ts
      accounts.ts
      onboarding.ts
      checkout.ts
      products.ts
      prices.ts
      webhooks.ts
      mapper.ts
    legacy/
      readonly-orders.ts
  repo/
    orders.ts
    events.ts
    entitlements.ts
    accounts.ts
    recipes.ts
    audit.ts
  contracts/
    requests.ts
    responses.ts
    openapi-fragments.ts
  shared/
    logger.ts
    rate-limit.ts
    timeouts.ts
```

## Entry points públicos
```text
api/payments/[...path].ts
api/checkout/create.ts              # alias temporário
api/checkout/webhook.ts             # alias temporário
```

## Estratégia de corte
1. criar módulo Stripe definitivo;
2. passar novas ordens para Stripe;
3. tornar Mercado Pago somente leitura temporária;
4. remover cron, rewrites, CSP e envs ligados a MP;
5. remover código e adapters legados;
6. manter somente Stripe.

## Regras duras
- nenhuma nova ordem pode nascer com `provider=mercadopago`
- nenhum dado bancário/documento bruto será salvo no Baserow
- nenhuma mudança de comportamento sem feature flag
- nenhuma mudança de schema sem expand → migrate → contract
- nenhum deploy de corte sem rollback em 1 comando

## Feature flags
- `ff_payments_router_v1`
- `ff_stripe_connect_ready_gate`
- `ff_payments_stripe_checkout`
- `ff_payments_stripe_webhook`
- `ff_payments_hide_legacy_ui`
- `ff_payments_provider_stripe_only`

## Timeouts por dependência
| Dependência | Timeout | Retry | Observação |
|---|---:|---:|---|
| Stripe API | 8000ms | 2 | exponencial + full jitter |
| Baserow API | 3000ms | 1 | só em 429/5xx |
| Webhook Stripe | 5000ms | 0 | fail fast |
| Sync de catálogo | 8000ms | 2 | idempotente |
| Repair manual | 10000ms | 1 | admin-only |

## Rate limit
- checkout session: 10 req / 5 min / IP + email hash
- connect admin: 30 req / 10 min / admin
- webhook Stripe: sem rate limit; validação por assinatura

## Estrutura de dados alvo
### Payment_Orders
Adicionar:
- `payment_provider`
- `provider_payment_id`
- `provider_checkout_id`
- `provider_account_id`
- `provider_status`
- `provider_event_id`
- `checkout_url`
- `checkout_url_kind`
- `provider_metadata_json`

### payment_events
Adicionar/normalizar:
- `provider`
- `provider_event_id`
- `provider_event_type`
- `payment_order_id`
- `processed_at`
- `raw_json`

### Recipes
Adicionar:
- `stripe_product_id`
- `stripe_price_id`
- `stripe_sync_status`
- `stripe_last_synced_at`

### Tabela nova
`stripe_connect_accounts`
- `tenant_id`
- `stripe_account_id`
- `status`
- `details_submitted`
- `charges_enabled`
- `payouts_enabled`
- `requirements_currently_due_json`
- `requirements_eventually_due_json`
- `default_currency`
- `disabled_reason`
- `created_at`
- `updated_at`
