# Achados priorizados

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## P0-001 — checkout principal ainda usa Mercado Pago
**Onde**: `src/server/payments/service.ts`

**Problema**  
O fluxo oficial de checkout ainda cria preferência Mercado Pago e retorna gateway legado.

**Impacto**  
Incompatível com a decisão de Stripe-only.

**Correção**
1. criar `providers/stripe/checkout.ts`;
2. substituir o núcleo de `createCheckout()` por `createStripeCheckoutSession()`;
3. gravar `provider=stripe`, `provider_checkout_id`, `checkout_url`;
4. tornar handler legado apenas um alias temporário.

**Critério de aceite**
- nova compra retorna URL de Stripe Checkout;
- nenhuma criação de preference MP acontece;
- nenhum pedido novo usa provider legado.

## P0-002 — `vercel.json` ainda transporta legado Mercado Pago
**Onde**: `vercel.json`

**Problema**  
CSP, rewrites e cron ainda carregam Mercado Pago.

**Impacto**  
Runtime híbrido e difícil de operar.

**Correção**
- remover CSP/rewrite/cron ligados a MP;
- manter somente rotas Stripe/payments;
- apagar referências a domínios Mercado Pago.

**Critério de aceite**
```bash
rg -n "mercadopago|mercado_pago" vercel.json
```
Output esperado: vazio.

## P0-003 — storage ainda está acoplado ao provider antigo
**Onde**: repo de pagamentos e tabela `Payment_Orders`

**Problema**  
Campos e mapeamentos orientados a MP.

**Impacto**  
Lock-in e alto risco de inconsistência.

**Correção**
Expandir campos genéricos e migrar leitura/escrita para provider-agnostic.

## P1-001 — conexão Stripe não representa readiness operacional
**Onde**: `src/server/integrations/stripe/connections.ts`

**Problema**  
Conectado ≠ pronto para cobrar.

**Correção**
Persistir `charges_enabled`, `payouts_enabled`, `details_submitted`, `requirements_*`.

## P1-002 — reconcile automático é muleta e consome quota
**Onde**: cron `/api/jobs/reconcile`

**Correção**
Substituir por repair manual admin-only.

## P1-003 — pasta de pagamentos não é canônica
**Problema**  
Código de pagamento espalhado.

**Correção**
Consolidar tudo em `src/server/payments/**`.

## P1-004 — observabilidade de pagamento ainda não está Stripe-first
**Correção**
Padronizar logs/métricas com:
- `provider`
- `payment_order_id`
- `provider_account_id`
- `provider_checkout_id`
- `provider_event_id`
- `tenant_id`

## P2-001 — legado MP pode continuar escondido em testes, envs e docs
**Correção**
Executar varredura final:
```bash
rg -n "mercadopago|mercado_pago|mp_" .
```
e remover tudo o que não for histórico de migração devidamente documentado.
