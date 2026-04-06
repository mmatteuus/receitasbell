# ATENÇÃO — STRIPE PRODUÇÃO (REALIDADE VALIDADA)

**Data:** 2026-04-06  
**Orquestrador:** ChatGPT

Antes de qualquer agente continuar o fluxo Stripe, ler nesta ordem:

1. `IMPLANTAR/dossies/DOSSIE-STRIPE-PROD-REAL-2026-04-06.md`
2. `IMPLANTAR/backend-audit-2026/F9-HANDOFF-STRIPE-PROD-REAL-2026-04-06.md`
3. `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
4. `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
5. `IMPLANTAR/DELEGACAO-AGENTES.md`

## Regra imediata

**Não** executar cutover para LIVE antes de:

- corrigir drift entre código e schema do Supabase
- validar Vercel/Stripe canônicos
- configurar webhook na rota correta

## Rota correta do webhook

- `/api/payments/webhooks/stripe`
- alias: `/api/payments/webhook`

**Não usar**:

- `/api/payments/stripe/webhook`

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
