# Bloqueios Ativos — Receitas Bell

**Última atualização:** 2026-04-06

## 🔴 BLOQUEIO CRÍTICO

### BLOQ-001: Stripe em Modo TEST

**Impacto:** Pagamentos reais não funcionam. Sistema não pode ir para produção.

**Causa:** Chaves `STRIPE_SECRET_KEY` e `STRIPE_PUBLISHABLE_KEY` são de TEST.

**Resolução:**

- **Agente:** Antigravity (navegador)
- **Ação:** Acessar dashboard Stripe, gerar chaves LIVE, atualizar Vercel env vars
- **Tarefa:** `IMPLANTAR/tasks/TASK-001-stripe-prod.md`

**Quando Desbloquear:**

- Chaves LIVE configuradas
- Webhook endpoint atualizado para LIVE mode
- Smoke test de pagamento real ok

---

## 🟡 BLOQUEIO MÉDIO

### BLOQ-002: Senha Admin Perdida

**Status:** 🟢 DESBLOQUEADO (2026-04-06)

**Resolução Executada:**

- ✅ Usuário admin localizado: `admin@receitasbell.com`
- ✅ Senha resetada para: `Receitasbell.com`
- ✅ Perfil verificado com role: `owner`
- ✅ Pronto para fazer login em `/admin`

**Script criado**: `scripts/reset-admin-password.mjs`

---

### BLOQ-003: Rota `/t/receitasbell` Retorna 404

**Status:** 🟢 DESBLOQUEADO (2026-04-06)

**Resolução Executada:**

- Tenant "receitasbell" verificado no banco
- API `/api/settings` retorna 200 OK
- Rota `https://receitasbell.mtsferreira.dev/t/receitasbell` funcional

**Link de Verificação**: Teste a rota em produção

---

## ⚪ SEM BLOQUEIOS TÉCNICOS

- Rate Limiting: implementável sem bloqueios
- Webhook Audit: apenas falta execução
- SEO: não é bloqueio técnico

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
