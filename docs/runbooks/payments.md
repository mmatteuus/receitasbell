# Payments Runbook

Use this runbook for checkout, webhook, reconcile, and Mercado Pago connection incidents.

## 1. Checkout creates duplicate orders
Symptoms:
- Repeated checkout retries create multiple internal orders.
- The same checkout reference returns inconsistent results.

What to check:
- `src/server/payments/service.ts`
- `src/server/payments/repo.ts`
- Logs for `checkout.idempotent_reuse` and `checkout.preference_created`

Expected behavior:
- Same `(tenant_id, idempotency_key)` reuses the same order.
- Same key with a different payload fails with `409`.

Mitigation:
1. Confirm the incoming payload is identical across retries.
2. Confirm the payment order stored for that idempotency key is the intended one.
3. If the payload changed, treat it as a new checkout reference instead of reusing the old key.

## 2. Webhook approved but order stays pending
Symptoms:
- Mercado Pago says the payment is approved, but the app still shows pending.

What to check:
- `api_handlers/checkout/webhook.ts`
- `api_handlers/jobs/reconcile.ts`
- Logs for `webhook.payment_synced` and `webhook.payment_sync_failed`

Mitigation:
1. Verify the webhook signature inputs are present.
2. Check whether the webhook already created a payment event row.
3. Run the reconcile job manually with the configured cron secret.
4. Confirm the tenant connection is still `connected`.

## 3. Mercado Pago connection expired
Symptoms:
- Checkout fails with a reconnect message.
- Webhook or reconcile logs show 401 or 403 from Mercado Pago.

Mitigation:
1. Reconnect the tenant from the admin UI.
2. Check whether the connection was marked `reconnect_required`.
3. Retry reconcile after the connection is restored.

## 4. Baserow transient failures
Symptoms:
- Read-only flows intermittently fail on Baserow 429/5xx.

What to check:
- `src/server/integrations/baserow/client.ts`
- Logs for `baserow.retry` and `baserow.request_failed`

Mitigation:
1. Confirm whether the failing call is idempotent.
2. Confirm whether the issue is a transient 429/5xx or a real schema/config problem.
3. If the issue is only transient on GET/listing, the client should retry automatically.
4. For POST/PATCH, do not retry blindly if the operation is non-idempotent.

## 5. Rollback guidance
- If the idempotency or auth change causes unexpected behavior, revert only the touched files for that change set.
- Do not restore a global admin bypass in production.
- Keep checkout duplicate protection in place; it is safe and should not be rolled back unless it is proven incorrect.
