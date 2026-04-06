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

**Impacto:** Impossível acessar painel admin para auditoria.

**Causa:** Senha do `admin@receitasbell.com` desconhecida.

**Resolução:**
- **Agente:** OpenCode ou Antigravity (SQL)
- **Ação:** Executar SQL reset no Supabase
- **Tarefa:** `IMPLANTAR/tasks/TASK-002-admin-reset.md`

**Quando Desbloquear:**
- Login funcional com senha `Receitasbell.com`
- Teste em `https://receitasbell.mtsferreira.dev/admin`

---

### BLOQ-003: Rota `/t/receitasbell` Retorna 404

**Impacto:** Usuários não conseguem acessar receitas do tenant principal.

**Causa:** **EM ANÁLISE** (Claude investigando)

**Resolução:**
- **Agente:** Claude (análise) → OpenCode (execução)
- **Tarefa:** `TASK-003-fix-404.md` (a ser criada)

**Quando Desbloquear:**
- Rota retorna 200
- Conteúdo renderiza corretamente

---

## ⚪ SEM BLOQUEIOS TÉCNICOS

- Rate Limiting: implementável sem bloqueios
- Webhook Audit: apenas falta execução
- SEO: não é bloqueio técnico

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)