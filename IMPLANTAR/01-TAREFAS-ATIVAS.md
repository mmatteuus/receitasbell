# Tarefas Ativas — Receitas Bell

**Última atualização:** 2026-04-06 (Orquestrador Claude)

## 🎯 TAREFA PRIORITÁRIA: STRIPE PRODUÇÃO

### TASK-001: Migrar Stripe para Modo LIVE

**Status:** 🔴 BLOQUEADO (requer Antigravity)

**Problema:**  
Stripe está em TEST mode. Pagamentos reais não funcionam.

**Solução:**  
Migração de chaves TEST → LIVE via dashboard Stripe.

**Agente Responsável:** Antigravity (acesso navegador)

**Arquivo de Tarefa:** `IMPLANTAR/tasks/TASK-001-stripe-prod.md`

**Quando Concluir:**
1. Marcar `[X]` aqui
2. Mover para `IMPLANTAR/02-HISTORICO.md`
3. Atualizar `IMPLANTAR/03-BLOQUEIOS.md` (remover bloqueio Stripe)

---

## 🔑 TAREFA CRÍTICA: ADMIN PASSWORD

### TASK-002: Resetar Senha Admin

**Status:** 🟡 PRONTO PARA EXECUÇÃO (OpenCode)

**Problema:**  
Login `admin@receitasbell.com` falha. Senha perdida.

**Solução:**  
Resetar via SQL no Supabase.

**Agente Responsável:** OpenCode ou Antigravity (SQL via Supabase UI)

**Arquivo de Tarefa:** `IMPLANTAR/tasks/TASK-002-admin-reset.md`

**Quando Concluir:**
1. Testar login em `https://receitasbell.mtsferreira.dev/admin`
2. Confirmar sucesso
3. Marcar `[X]`
4. Mover para histórico

---

## 🐛 TAREFA ALTA PRIORIDADE: ROTA 404

### TASK-003: Corrigir 404 em `/t/receitasbell`

**Status:** 🔴 EM ANÁLISE (Claude)

**Problema:**  
Rota `https://receitasbell.mtsferreira.dev/t/receitasbell` retorna 404.

**Próximos Passos:**
1. Claude analisa rotas em `/src/App.tsx` e `/src/routes.tsx`
2. Identifica causa do 404
3. Cria `TASK-003-fix-404.md` com solução detalhada
4. Delega para OpenCode

**Quando Concluir:**
1. Rota funcional (retorna 200)
2. Smoke test ok
3. Marcar `[X]`

---

## 📊 FILA DE TAREFAS

| ID | Título | Status | Agente | Prioridade |
|----|--------|--------|--------|------------|
| TASK-001 | Stripe LIVE | 🔴 BLOQUEADO | Antigravity | P0 |
| TASK-002 | Admin Reset | 🟡 PRONTO | OpenCode | P0 |
| TASK-003 | Fix 404 | 🔴 ANÁLISE | Claude → OpenCode | P0 |
| TASK-004 | Webhook Audit | ⚪ PENDENTE | OpenCode | P1 |
| TASK-005 | Rate Limit | ⚪ PENDENTE | OpenCode | P2 |

---

## ⚠️ REGRAS DE EXECUÇÃO

1. **Antes de iniciar tarefa:** marcar `[EM EXECUÇÃO - Nome do Agente]`
2. **Após concluir:** testar, comitar, aguardar deploy, **então** marcar `[X]`
3. **Se falhar:** documentar erro em `IMPLANTAR/03-BLOQUEIOS.md`
4. **Sempre:** atualizar este arquivo após cada ação

---

**Orquestrador:** Claude (via contexto persistente)  
**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)