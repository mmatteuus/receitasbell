# Tarefas Ativas — Receitas Bell

**Última atualização:** 2026-04-06 (Orquestrador Claude)

## 🎯 TAREFA PRIORITÁRIA: STRIPE PRODUÇÃO

### TASK-001: Migrar Stripe para Modo LIVE

**Status:** 🔵 EM EXECUÇÃO - Antigravity

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

**Status:** 🟢 CONCLUÍDO (OpenCode - 2026-04-06)

**Problema:**  
Login `admin@receitasbell.com` falha. Senha perdida.

**Solução Implementada:**

1. ✅ Script `reset-admin-password.mjs` criado
2. ✅ Usuário admin localizado no Supabase
3. ✅ Senha resetada para `Receitasbell.com`
4. ✅ Perfil verificado (role: owner)

**Resultado:**

- Email: `admin@receitasbell.com`
- Nova Senha: `Receitasbell.com`
- ID: `13c4c0a5-2bc6-4b5a-ab01-d333e95d2e80`
- Status: ✅ Pronto para login

---

## 🐛 TAREFA ALTA PRIORIDADE: ROTA 404

### TASK-003: Corrigir 404 em `/t/receitasbell`

**Status:** 🟢 CONCLUÍDO (OpenCode - 2026-04-06)

**Problema:**  
Rota `https://receitasbell.mtsferreira.dev/t/receitasbell` retorna 404.

**Solução Implementada:**

1. ✅ Claude analisou rotas e identificou root cause
2. ✅ Tenant "receitasbell" já existia no banco
3. ✅ API `/api/settings` retorna 200 com sucesso
4. ✅ Rota agora funcional

**Resultado:**

- Rota: `https://receitasbell.mtsferreira.dev/t/receitasbell` → **200 OK**
- API Settings: **200 OK**
- Tenant encontrado: `f413ea13-fcd9-5b44-9d22-1fa1f7b063a5`

---

## 📊 FILA DE TAREFAS

| ID       | Título        | Status       | Agente      | Prioridade |
| -------- | ------------- | ------------ | ----------- | ---------- |
| TASK-001 | Stripe LIVE   | 🔴 BLOQUEADO | Antigravity | P0         |
| TASK-002 | Admin Reset   | 🟢 CONCLUÍDO | OpenCode    | P0         |
| TASK-003 | Fix 404       | 🟢 CONCLUÍDO | OpenCode    | P0         |
| TASK-004 | Webhook Audit | ⚪ PENDENTE  | OpenCode    | P1         |
| TASK-005 | Rate Limit    | ⚪ PENDENTE  | OpenCode    | P2         |

---

## ⚠️ REGRAS DE EXECUÇÃO

1. **Antes de iniciar tarefa:** marcar `[EM EXECUÇÃO - Nome do Agente]`
2. **Após concluir:** testar, comitar, aguardar deploy, **então** marcar `[X]`
3. **Se falhar:** documentar erro em `IMPLANTAR/03-BLOQUEIOS.md`
4. **Sempre:** atualizar este arquivo após cada ação

---

**Orquestrador:** Claude (via contexto persistente)  
**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
