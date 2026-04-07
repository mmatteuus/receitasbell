# TASK-004: Corrigir Drift Stripe ↔ Supabase (Schema + Webhook)

**ID:** TASK-004  
**Prioridade:** P0 (Crítico)  
**Status:** 🔴 PENDENTE  
**Agente:** OpenCode  
**Criado em:** 2026-04-06  

---

## 🎯 OBJETIVO

Realinhar o backend Stripe ao **schema real** do Supabase antes de qualquer cutover para LIVE.

---

## 🚨 FATORES CRÍTICOS CONFIRMADOS

### FATO 1 — `payment_orders` real não bate com o código atual

O banco real usa `amount_cents`, `metadata`, `provider_event_id`, `provider_metadata_json`, `provider_payment_id`, mas o código atual tenta usar também campos como:

- `amount`
- `payer_email`
- `provider_payment_method_id`
- `provider_payment_type_id`

### FATO 2 — `recipe_purchases` real não bate com o webhook atual

O banco real expõe apenas:

- `tenant_id`
- `user_id`
- `recipe_id`
- `payment_id`

Mas o webhook atual tenta gravar também:

- `amount_paid`
- `provider`
- `provider_payment_id`
- `payment_order_id`

### FATO 3 — `src/server/identity/entitlements.repo.ts` também está desalinhado

Hoje ele lê/grava `recipe_purchases` como se existissem:

- `payer_email`
- `recipe_slug`
- `access_status`

No banco real esses campos não existem.

### FATO 4 — rota correta do webhook

A rota válida é:

- `/api/payments/webhooks/stripe`

Alias compatível:

- `/api/payments/webhook`

**NÃO usar**: `/api/payments/stripe/webhook`

---

## 📋 ESCOPO OBRIGATÓRIO

### 1. Corrigir `src/server/payments/repo.ts`

**Ações mínimas:**

- escrever em `amount_cents` no insert
- ler `amount_cents` e converter para o formato usado pela aplicação
- parar de depender de `payer_email` fora de uma estratégia explícita
- usar `metadata`/`provider_metadata_json` de forma consistente
- não escrever colunas que não existem no banco

### 2. Corrigir `src/server/payments/application/handlers/checkout/session.ts`

**Ações mínimas:**

- validar que a criação de `payment_orders` continua funcionando com o repo corrigido
- preservar `client_reference_id = order.id`
- preservar `metadata.tenantId` no Checkout Session

### 3. Corrigir `src/server/payments/application/handlers/webhooks/stripe.ts`

**Ações mínimas:**

- manter `constructEvent()` como está
- persistir evento de forma idempotente
- parar de gravar payload incompatível em `recipe_purchases`
- alinhar a concessão de acesso à fonte de verdade real do projeto
- registrar `payment_events` ou coluna equivalente para auditoria do evento Stripe

### 4. Corrigir `src/server/identity/entitlements.repo.ts`

**Ações mínimas:**

- alinhar com o banco real
- remover suposições legadas sobre `payer_email`, `recipe_slug`, `access_status`
- decidir uma única fonte de verdade para “compra/liberação de acesso”

### 5. Adicionar idempotência real

**Mínimo aceitável:**

- reprocessar o mesmo `event.id` do Stripe não pode duplicar grant
- se precisar, criar migration reversível para suportar `provider_event_id` único ou tabela de eventos processados

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:unit`
- [ ] criação de checkout não quebra no schema real
- [ ] webhook `checkout.session.completed` não quebra no schema real
- [ ] reenvio do mesmo evento Stripe não duplica grant
- [ ] admin consegue ver pedido sem campos quebrados/undefined críticos

---

## 🧪 TESTES OBRIGATÓRIOS

1. teste unitário/repo para insert/update em `payment_orders`
2. teste do webhook com `checkout.session.completed`
3. teste de idempotência com mesmo `event.id`
4. teste da rota correta `/api/payments/webhooks/stripe`

---

## 🔄 ROLLBACK

Se qualquer parte falhar:

```bash
git revert HEAD
```

**Não** executar cutover LIVE antes de este task passar completo.

---

## 📎 CONTEXTO DE LEITURA

1. `IMPLANTAR/dossies/DOSSIE-STRIPE-PROD-REAL-2026-04-06.md`
2. `IMPLANTAR/backend-audit-2026/F9-HANDOFF-STRIPE-PROD-REAL-2026-04-06.md`
3. `src/server/payments/repo.ts`
4. `src/server/payments/application/handlers/checkout/session.ts`
5. `src/server/payments/application/handlers/webhooks/stripe.ts`
6. `src/server/identity/entitlements.repo.ts`

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
