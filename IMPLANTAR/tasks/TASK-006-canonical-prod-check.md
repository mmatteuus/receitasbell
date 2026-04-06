# TASK-006: Confirmar Produção Canônica (Vercel + Stripe) Antes do LIVE

**ID:** TASK-006  
**Prioridade:** P0 (Crítico)  
**Status:** 🔴 PENDENTE  
**Agente:** Antigravity  
**Criado em:** 2026-04-06  

---

## 🎯 OBJETIVO

Descobrir e validar **qual é a produção real** antes de trocar qualquer chave para LIVE.

---

## 🚨 ACHADOS QUE PRECISAM SER VALIDADOS NO NAVEGADOR

### 1. Vercel canônico

O MCP viu o projeto:

- Team: `matdev`
- Projeto: `receitasbell`

Mas também houve inconsistência entre:
- status de deploy visto no Vercel MCP
- status de commit visto no GitHub

**Você precisa confirmar no navegador**:
- qual projeto Vercel é o canônico
- qual domínio responde como produção real
- se `receitasbell.mtsferreira.dev` aponta para esse projeto mesmo

### 2. Stripe canônico

O MCP do Stripe retornou conta da plataforma diferente da que está escrita nos docs antigos.

**Você precisa confirmar no navegador**:
- account da plataforma real
- se Connect está ativado nessa conta
- se a conta conectada do tenant bate com o banco real

### 3. Webhook canônico

Os docs antigos apontam `/api/payments/stripe/webhook`.

**Isso está errado para o código atual.**

Você deve validar e usar:

- `https://SEU-DOMINIO/api/payments/webhooks/stripe`

Alias compatível:

- `https://SEU-DOMINIO/api/payments/webhook`

---

## 📋 PASSOS EXATOS

### Fase 1 — Vercel

1. Abrir o dashboard Vercel do projeto real
2. Confirmar:
   - nome do projeto
   - team correta
   - domínio(s) de produção
   - último deploy realmente funcional
3. Registrar no dossiê qual URL é a produção real

### Fase 2 — Stripe

1. Abrir a dashboard Stripe da plataforma correta
2. Confirmar:
   - se está em TEST ou LIVE
   - se Connect está habilitado
   - account da plataforma
3. Em Connect, validar a conta conectada do tenant real
4. Registrar qualquer divergência entre docs e dashboard

### Fase 3 — Webhook

1. Em `Developers -> Webhooks`, localizar ou criar o endpoint
2. Usar a rota correta:
   - `/api/payments/webhooks/stripe`
3. Eventos mínimos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `account.updated`
4. Copiar `whsec_...`
5. **Não** trocar para LIVE ainda se TASK-004 não tiver sido concluído

### Fase 4 — Env Vars

Somente depois de TASK-004 concluído:

- validar `STRIPE_SECRET_KEY`
- validar `STRIPE_WEBHOOK_SECRET`
- validar se existe `STRIPE_PUBLISHABLE_KEY` quando aplicável

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] projeto Vercel real identificado
- [ ] domínio real identificado
- [ ] conta Stripe da plataforma confirmada
- [ ] conta conectada do tenant confirmada
- [ ] webhook configurado na rota correta
- [ ] `whsec_...` copiado e pronto
- [ ] handoff registrado para o cutover LIVE

---

## 🚫 NÃO FAZER AINDA

- não fazer pagamento real
- não trocar para LIVE antes de TASK-004
- não usar a rota antiga `/api/payments/stripe/webhook`

---

## 📎 CONTEXTO DE LEITURA

1. `IMPLANTAR/dossies/DOSSIE-STRIPE-PROD-REAL-2026-04-06.md`
2. `IMPLANTAR/backend-audit-2026/F9-HANDOFF-STRIPE-PROD-REAL-2026-04-06.md`
3. `IMPLANTAR/DELEGACAO-AGENTES.md`

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
