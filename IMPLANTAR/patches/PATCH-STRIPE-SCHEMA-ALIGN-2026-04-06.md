# PATCH EXATO — Stripe ↔ Supabase ↔ Webhook

**Data:** 2026-04-06  
**Autor:** ChatGPT  
**Status:** PRONTO PARA APLICAÇÃO MANUAL POR EXECUTOR  

---

## O QUE ESTÁ QUEBRANDO DE VERDADE

### 1. `payment_orders.user_id` é UUID no banco
Mas `checkout/session.ts` hoje faz:

```ts
const userId = body.userId || body.payerEmail;
```

Depois grava isso em `payment_orders.user_id`.

**Problema:** se `body.userId` vier vazio, o valor vira email, e a coluna no banco é `uuid`. Isso tende a quebrar o checkout antes mesmo do webhook.

### 2. `payment_orders` real usa `amount_cents` e `metadata`
Mas `repo.ts` ainda tenta usar `amount` e `payer_email`.

### 3. `recipe_purchases` não combina com o payload atual do webhook
O webhook tenta gravar colunas que não existem no schema real.

### 4. A fonte de verdade coerente para liberação de acesso é `entitlements`
Existe tabela `entitlements` já pronta para esse modelo, mas a camada `identity/entitlements.repo.ts` ainda está apontando para uma versão legada de `recipe_purchases`.

---

## ARQUIVOS QUE DEVEM SER SUBSTITUÍDOS PELOS EXECUTORES

1. `src/server/payments/application/handlers/checkout/session.ts`
2. `src/server/payments/repo.ts`
3. `src/server/payments/application/handlers/webhooks/stripe.ts`
4. `src/server/identity/entitlements.repo.ts`

Os conteúdos completos corrigidos estão nesta pasta:

- `IMPLANTAR/patches/src/server/payments/application/handlers/checkout/session.ts`
- `IMPLANTAR/patches/src/server/payments/repo.ts`
- `IMPLANTAR/patches/src/server/payments/application/handlers/webhooks/stripe.ts`
- `IMPLANTAR/patches/src/server/identity/entitlements.repo.ts`

---

## ROTA CORRETA DO WEBHOOK

**Usar:**

- `/api/payments/webhooks/stripe`
- alias: `/api/payments/webhook`

**Não usar:**

- `/api/payments/stripe/webhook`

---

## TESTES OBRIGATÓRIOS APÓS PATCH

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
```

E testar:

1. criar checkout
2. completar `checkout.session.completed`
3. reenviar o mesmo evento
4. confirmar que não duplica `entitlements`
5. confirmar `payment_events` com `payload.eventId`

---

## RESPONSÁVEL POR APLICAR

- **OpenCode**: aplicar patch de código
- **Antigravity**: validar Vercel/Stripe canônicos e configurar webhook correto

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
