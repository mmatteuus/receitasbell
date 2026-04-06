# DOSSIÊ REAL: Stripe Produção — Receitas Bell

**Data:** 2026-04-06  
**Orquestrador:** ChatGPT  
**Escopo:** GitHub + Vercel + Stripe + Supabase MCP  
**Objetivo:** separar problema real de configuração, código e banco antes do cutover LIVE

---

## 1. RESUMO EXECUTIVO

O bloqueio Stripe **não** é só virar `sk_test_` para `sk_live_`.

Hoje existem **quatro** problemas simultâneos:

1. **Drift real entre código e schema do Supabase**
2. **Webhook/documentação apontando rota errada**
3. **Inconsistência sobre qual Vercel é a produção canônica**
4. **Inconsistência entre account Stripe documentado e account visto pelo MCP**

**Conclusão operacional:**  
`TASK-001` (LIVE) fica bloqueado até `TASK-004` (OpenCode) e `TASK-006` (Antigravity).

---

## 2. FATO CONFIRMADO — WEBHOOK JÁ VALIDA ASSINATURA

O handler atual usa `stripeClient.webhooks.constructEvent(...)` e faz as checagens mínimas de:

- método
- `STRIPE_WEBHOOK_SECRET`
- header `stripe-signature`
- raw body
- payload vazio

**Logo:** a validação de assinatura não é o principal problema agora.

---

## 3. FATO CONFIRMADO — ROTAS REAIS DO WEBHOOK

O router atual aceita:

- `/api/payments/webhooks/stripe`
- `/api/payments/webhook` (alias)

**Rota errada encontrada na documentação antiga:**

- `/api/payments/stripe/webhook`

Isso precisa ser corrigido nos playbooks dos agentes.

---

## 4. FATO CONFIRMADO — `payment_orders` DO BANCO REAL NÃO BATE COM O CÓDIGO

### Banco real expõe

- `amount_cents`
- `metadata`
- `provider_event_id`
- `provider_metadata_json`
- `provider_payment_id`
- `recipe_ids`
- `items`
- `idempotency_key`

### Código atual ainda assume

- `amount`
- `payer_email`
- `provider_payment_method_id`
- `provider_payment_type_id`

**Impacto:** checkout e leitura/admin podem quebrar mesmo antes do LIVE.

---

## 5. FATO CONFIRMADO — `recipe_purchases` DO BANCO REAL NÃO BATE COM O WEBHOOK

### Banco real expõe

- `tenant_id`
- `user_id`
- `recipe_id`
- `payment_id`

### Webhook atual tenta gravar também

- `amount_paid`
- `provider`
- `provider_payment_id`
- `payment_order_id`

**Impacto:** o grant pós-pagamento tende a falhar no schema real.

---

## 6. FATO CONFIRMADO — CAMADA DE ENTITLEMENT TAMBÉM ESTÁ LEGADA

`src/server/identity/entitlements.repo.ts` ainda trata `recipe_purchases` como se tivesse:

- `payer_email`
- `recipe_slug`
- `access_status`

No banco real esses campos não existem.

**Impacto:** existe drift não só no webhook, mas também na leitura da liberação de acesso.

---

## 7. FATO CONFIRMADO — IDEMPOTÊNCIA AINDA NÃO ESTÁ FECHADA

O webhook lê `event.id`, mas hoje não há garantia operacional forte de que o mesmo evento não vai gerar reprocessamento duplicado.

**Necessário:** persistência idempotente real do evento Stripe.

---

## 8. FATO CONFIRMADO — AGENTES JÁ ESTÃO DEFINIDOS

Não é preciso perguntar de novo quem são os agentes.

Fonte de verdade já existente:
- `IMPLANTAR/DELEGACAO-AGENTES.md`
- `IMPLANTAR/00-CONTEXTO-PERMANENTE.md`

Papéis úteis para este incidente:
- **OpenCode:** executor de código
- **Antigravity:** navegador/dashboard/deploy
- **ChatGPT:** backup executor
- **Orquestrador:** análise e handoff

---

## 9. FATO CONFIRMADO — HÁ INCONSISTÊNCIA DE PRODUÇÃO CANÔNICA

### Vercel

O MCP do Vercel mostrou um projeto `matdev/receitasbell` com estado divergente do que o GitHub reporta no status do commit.

### Stripe

O account visto no MCP do Stripe não bate com o account citado nos docs antigos do `IMPLANTAR`.

**Impacto:** se Antigravity trocar env var no projeto/conta errada, o problema piora.

---

## 10. DECISÃO OPERACIONAL

### Não fazer agora

- não trocar para LIVE
- não criar endpoint no caminho antigo
- não testar pagamento real
- não fazer correção “rápida” no código sem alinhar banco

### Fazer agora

1. OpenCode executa `TASK-004`
2. Antigravity executa `TASK-006`
3. só depois volta para `TASK-001`

---

## 11. HANDOFF PARA OPENCODE

Arquivo:
- `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`

Missão:
- alinhar `repo.ts`
- alinhar `checkout/session.ts`
- alinhar `webhooks/stripe.ts`
- alinhar `identity/entitlements.repo.ts`
- adicionar idempotência real
- rodar gate completo

---

## 12. HANDOFF PARA ANTIGRAVITY

Arquivo:
- `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`

Missão:
- descobrir Vercel canônico
- descobrir Stripe canônico
- corrigir playbook do webhook
- preparar `whsec_...`
- **não** fazer LIVE antes do TASK-004

---

## 13. ARQUIVOS QUE DEVEM SER LIDOS PELOS AGENTES

1. `IMPLANTAR/dossies/DOSSIE-STRIPE-PROD-REAL-2026-04-06.md`
2. `IMPLANTAR/backend-audit-2026/F9-HANDOFF-STRIPE-PROD-REAL-2026-04-06.md`
3. `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
4. `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
5. `IMPLANTAR/DELEGACAO-AGENTES.md`

---

## 14. STATUS FINAL DESTE DOSSIE

- ✅ análise factual feita
- ✅ drift principal isolado
- ✅ delegação definida
- ✅ rota errada do webhook identificada
- ✅ necessidade de perguntar agentes descartada (já documentado)
- ⛔ corte LIVE bloqueado até correção real

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
