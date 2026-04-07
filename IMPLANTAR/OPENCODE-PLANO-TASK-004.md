# 📋 OPENCODE — Plano de Execução TASK-004

**Data:** 2026-04-06  
**Status:** 🔴 INICIANDO  
**Objetivo:** Corrigir drift Stripe ↔ Supabase (Schema + Webhook)

---

## 📊 ANÁLISE DO PROBLEMA

### Campos que não devem ser usados (REMOVER)
- `amount` → usar `amount_cents` 
- `payer_email` → remover suposições, lidar com metadata
- `provider_payment_method_id` → não existe no schema real
- `provider_payment_type_id` → não existe no schema real
- `amount_paid` → não existe em `recipe_purchases`
- `provider` → não existe em `recipe_purchases`
- `payment_order_id` → não existe em `recipe_purchases`
- `payer_email` em entitlements
- `recipe_slug` em entitlements
- `access_status` em entitlements

### Campos que existem no schema real e devem ser usados
- `amount_cents` (payment_orders)
- `metadata` (payment_orders)
- `provider_event_id` (payment_orders)
- `provider_metadata_json` (payment_orders)
- `provider_payment_id` (payment_orders)
- `idempotency_key` (payment_orders)
- `recipe_ids` (payment_orders)
- `items` (payment_orders)
- `tenant_id`, `user_id`, `recipe_id`, `payment_id` (recipe_purchases)

---

## 🗂️ ARQUIVOS A MODIFICAR (ORDEM LÓGICA)

### 1️⃣ `src/server/payments/repo.ts` (CRÍTICO)
**Por quê?** Todos os outros dependem deste.

**Mudanças obrigatórias:**
- [ ] Trocar `amount` por `amount_cents` nos inserts
- [ ] Converter `amount_cents` → número quando lê do banco
- [ ] Remover `payer_email` do insert (não existe)
- [ ] Remover `provider_payment_method_id` (não existe)
- [ ] Remover `provider_payment_type_id` (não existe)
- [ ] Usar `metadata` ou `provider_metadata_json` consistentemente
- [ ] Usar `provider_event_id` para idempotência

**Teste:** Criar `payment_order` sem erro no banco

---

### 2️⃣ `src/server/payments/application/handlers/checkout/session.ts`
**Por quê?** Depende do repo.ts, precisa validar que funciona com schema real.

**Mudanças obrigatórias:**
- [ ] Validar chamada ao repo com campos corretos
- [ ] Manter `client_reference_id = order.id`
- [ ] Manter `metadata.tenantId` na sessão

**Teste:** Checkout não quebra

---

### 3️⃣ `src/server/payments/application/handlers/webhooks/stripe.ts` (CRÍTICO)
**Por quê?** Tenta gravar campos que não existem em `recipe_purchases`.

**Mudanças obrigatórias:**
- [ ] Manter `constructEvent()` como está ✅
- [ ] Persistir evento de forma idempotente (usar `provider_event_id`)
- [ ] Parar de gravar campos inválidos em `recipe_purchases`:
  - remover `amount_paid`
  - remover `provider`
  - remover `payment_order_id`
- [ ] Gravar apenas: `tenant_id`, `user_id`, `recipe_id`, `payment_id`
- [ ] Usar repositório correto para ligar `payment_id` ↔ `recipe_id`

**Teste:** Webhook não quebra, grant é criado

---

### 4️⃣ `src/server/identity/entitlements.repo.ts` (CRÍTICO)
**Por quê?** Lê `recipe_purchases` com campos legados.

**Mudanças obrigatórias:**
- [ ] Remover suposições sobre `payer_email`, `recipe_slug`, `access_status`
- [ ] Usar `recipe_id` e `user_id` como fonte de verdade
- [ ] Decidir: é `recipe_purchases` a fonte de verdade ou precisamos de outra tabela?

**Teste:** Leitura de grants funciona

---

### 5️⃣ Idempotência (pode ser migration ou lógica)
**Por quê?** Reprocessar mesmo evento não pode duplicar grant.

**Mudanças obrigatórias:**
- [ ] Usar `provider_event_id` do Stripe como chave única
- [ ] Se precisar, criar migration para `provider_event_id UNIQUE` em `payment_orders`
- [ ] Webhook valida idempotência antes de criar grant

**Teste:** Mesmo evento Stripe 2x = 1 grant

---

## ✅ CRITÉRIOS DE ACEITE (CHECKLIST FINAL)

- [ ] `npm run lint` passa
- [ ] `npm run typecheck` passa
- [ ] `npm run build` passa
- [ ] `npm run test:unit` passa
- [ ] Checkout cria `payment_order` sem erros
- [ ] Webhook `checkout.session.completed` funciona
- [ ] Reenvio de evento não duplica grant
- [ ] Admin consegue ver pedido
- [ ] Rota correta: `/api/payments/webhooks/stripe`

---

## 🔄 GITFLOW

1. Branch: `feature/task-004-stripe-realign`
2. Commits pequenos (1 mudança lógica por commit)
3. Cada commit tem seu próprio teste/validação
4. PR com descrição clara apontando para TASK-004
5. Não fazer merge (Antigravity faz após TASK-006)

---

## ⚠️ REGRAS DE SEGURANÇA

- ❌ Nunca remover coluna do banco
- ❌ Nunca mudar variáveis de env
- ❌ Nunca assumir webhook está certo (TASK-006 valida)
- ✅ Sempre testar localmente antes de comitar

---

## 📝 STATUS DE EXECUÇÃO

```
[EM PROGRESSO] Lendo código atual (repo.ts)
[ ] Analisando schema real vs código
[ ] Atualizando repo.ts
[ ] Atualizando checkout/session.ts
[ ] Atualizando webhooks/stripe.ts
[ ] Atualizando entitlements.repo.ts
[ ] Implementando idempotência
[ ] Validando testes
[ ] Criando PR
```

**Atualizado:** 2026-04-06 22:50

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
