# Payments Runbook

Use este runbook para incidentes de checkout, Stripe Connect e webhooks Stripe.

## 1. Checkout cria pedidos duplicados

Symptoms:

- Retries repetidos criam mais de um pedido interno.
- O mesmo `checkoutReference` retorna resultados inconsistentes.

What to check:

- `src/server/payments/application/handlers/checkout/session.ts`
- `src/server/payments/repo.ts`
- logs de checkout e persistencia de `payment_orders`

Expected behavior:

- o payload valido cria um unico pedido e uma unica Stripe Checkout Session.

Mitigation:

1. Confirmar se o payload recebido e o mesmo entre retries.
2. Verificar a ordem persistida e o `idempotency_key` correspondente.
3. Se o payload mudou, usar um novo `checkoutReference`.

## 2. Webhook Stripe aprovado mas pedido continua pendente

Symptoms:

- A sessao no Stripe aparece como paga, mas o pedido interno continua `pending`.

What to check:

- `/api/payments/webhooks/stripe`
- `src/server/payments/application/handlers/webhooks/stripe.ts`
- `src/server/integrations/stripe/webhook.ts`

Mitigation:

1. Verificar se `STRIPE_WEBHOOK_SECRET` esta configurado.
2. Confirmar se o webhook chegou com `stripe-signature` valido.
3. Validar se `client_reference_id` e `tenantId` chegaram na sessao.
4. Reprocessar o evento manualmente no dashboard do Stripe, se necessario.

## 3. Stripe Connect exige reconexao

Symptoms:

- O painel indica `reconnect_required`.
- O onboarding falha ou a conta conectada fica indisponivel.

What to check:

- `/api/payments/connect/status`
- `/api/payments/connect/onboarding-link`
- `/api/payments/connect/callback`

Mitigation:

1. Solicitar nova conexao pelo painel admin.
2. Confirmar se o callback voltou para `/admin/pagamentos/configuracoes`.
3. Verificar se a conexao do tenant voltou para `connected`.

## 4. Banco ou configuracao impedem pagamentos

Symptoms:

- Readiness volta `unavailable`.
- Checkout falha antes de criar a sessao do Stripe.

What to check:

- `/api/health/ready`
- `src/server/integrations/supabase/client.ts`
- variaveis `SUPABASE_*` e `STRIPE_*`

Mitigation:

1. Confirmar credenciais do Supabase.
2. Confirmar segredos do Stripe.
3. Validar se o tenant possui conta conectada ativa.

## 5. Rollback guidance

- Reverter apenas o conjunto de arquivos da mudanca problematica.
- Nao restaurar bypass administrativo em producao.
- Manter validacao de webhook e protecoes de checkout.
