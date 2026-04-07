# F9 — HANDOFF REAL: Stripe Produção

**Data:** 2026-04-06  
**Orquestrador:** ChatGPT  
**Status:** EXECUÇÃO BLOQUEADA ATÉ SEGUIR ORDEM

---

## ORDEM OBRIGATÓRIA

1. **OpenCode** executa `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
2. **Antigravity** executa `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
3. **Antigravity** retoma `IMPLANTAR/tasks/TASK-001-stripe-prod.md`
4. **OpenCode** executa rate limit / hardening depois do LIVE controlado

---

## BLOQUEIOS DUROS

- não usar `/api/payments/stripe/webhook`
- não trocar para LIVE antes do TASK-004
- não assumir que a conta Stripe documentada continua correta
- não assumir que o projeto Vercel visto em docs antigos é o canônico

---

## OPENCODE — ENTREGA MÍNIMA

### Objetivo
Fazer o backend Stripe funcionar com o banco real.

### Saída esperada
- checkout criando `payment_orders` sem colunas inválidas
- webhook persistindo sem colunas inválidas
- liberação de acesso coerente
- idempotência real
- `npm run gate` passando

### Arquivo de referência
- `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`

---

## ANTIGRAVITY — ENTREGA MÍNIMA

### Objetivo
Descobrir e preparar a produção real sem causar incidente.

### Saída esperada
- projeto Vercel canônico identificado
- domínio canônico identificado
- conta Stripe canônica identificada
- webhook correto preparado
- `whsec_...` pronto
- cutover LIVE pronto para ser feito depois do TASK-004

### Arquivo de referência
- `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`

---

## NOTA SOBRE AGENTES

A lista de agentes **já existe** em:

- `IMPLANTAR/DELEGACAO-AGENTES.md`

Não recriar lista; apenas seguir a delegação já oficializada.

---

## SINAL VERDE PARA LIVE

O LIVE só pode acontecer quando:

- TASK-004 = ✅
- TASK-006 = ✅
- rota do webhook correta = ✅
- domínio de produção correto = ✅
- env vars corretas = ✅

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
