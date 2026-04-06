# Sistema de Coordenação de Tarefas - Receitas Bell Backend

**REGRA OBRIGATÓRIA:** Antes de iniciar qualquer tarefa, o agente DEVE:
1. Ler este arquivo
2. Verificar se a tarefa já está sendo executada
3. Registrar a tarefa com seu nome e timestamp
4. Atualizar o status ao concluir

**NUNCA execute uma tarefa que já está com status "EM_PROGRESSO"**

---

## 📋 COMO USAR

### Antes de Começar uma Tarefa
```markdown
1. Ler TASK-TRACKER.md
2. Buscar pela tarefa (ex: P0-1)
3. Verificar status:
   - ✅ CONCLUIDO → Não fazer nada
   - ⏳ EM_PROGRESSO → PARAR! Outro agente está fazendo
   - 📝 PENDENTE → OK para pegar
4. Atualizar status para EM_PROGRESSO
5. Adicionar seu nome e timestamp
```

### Ao Concluir uma Tarefa
```markdown
1. Atualizar status para CONCLUIDO
2. Adicionar timestamp de conclusão
3. Adicionar link do commit/PR
4. Marcar próxima tarefa como PENDENTE
```

---

## 🔴 TAREFAS CRÍTICAS (P0) - 8 tarefas

### P0-1: Multi-Tenancy - Validar RLS no Supabase
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivo alvo:** Supabase Dashboard > Policies
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** P0-7

### P0-2: Timeouts - Adicionar em Todas Dependências
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - `src/server/integrations/supabase/client.ts`
  - `src/server/integrations/stripe/client.ts`
  - `src/server/integrations/upstash/client.ts`
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** P1-2

### P0-3: Rate Limiting - Implementar e Validar
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - `src/server/shared/rate-limit.ts` (criar)
  - `api/*/` (aplicar middleware)
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** Nenhuma

### P0-4: SLI/SLO - Definir e Implementar Tracking
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - `src/server/shared/slo.ts` (criar)
  - Middleware de tracking
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** P0-8

### P0-5: SBOM - Gerar em CI
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - `.github/workflows/security.yml`
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** Nenhuma

### P0-6: Connection Pooling - Configurar Supabase Pooler
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - Vercel: Environment Variables (SUPABASE_URL)
  - `src/server/integrations/supabase/client.ts`
- **Commit/PR:** (vazio)
- **Dependências:** Nenhuma
- **Bloqueia:** Nenhuma

### P0-7: Validação Input - Auditar Todas Rotas
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - Todas as rotas em `api/`
  - Zod schemas
- **Commit/PR:** (vazio)
- **Dependências:** P0-1 (validar RLS primeiro)
- **Bloqueia:** Nenhuma

### P0-8: Alertas - Configurar Burn-Rate no Sentry
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Prioridade:** URGENTE
- **Prazo:** 24h
- **Iniciado em:** (vazio)
- **Concluído em:** (vazio)
- **Arquivos alvo:**
  - Sentry Dashboard
  - `src/server/shared/sentry.ts`
- **Commit/PR:** (vazio)
- **Dependências:** P0-4 (SLO definido)
- **Bloqueia:** Nenhuma

---

## 🟠 TAREFAS ALTAS (P1) - 12 tarefas

### P1-1: Cursor Pagination
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `src/server/repositories/*.ts`
- **Dependências:** Nenhuma

### P1-2: Retry com Backoff + Jitter
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `src/server/shared/retry.ts`
- **Dependências:** P0-2

### P1-3: Fixar GitHub Actions por SHA
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `.github/workflows/*.yml`
- **Dependências:** Nenhuma

### P1-4: OpenAPI 3.1 Completo
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `openapi/openapi.yaml`
- **Dependências:** Nenhuma

### P1-5: Idempotência
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `src/server/shared/idempotency.ts`
- **Dependências:** P0-3 (Redis rate limit)

### P1-6: Graceful Shutdown
- **Status:** ❌ N/A (Vercel Serverless)
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)

### P1-7: Health Check Completo
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `api/health/*.ts`
- **Dependências:** P0-6 (pooling)

### P1-8: CORS Validação
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `src/server/shared/cors.ts`
- **Dependências:** Nenhuma

### P1-9: Logger Estruturado
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `src/server/shared/logger.ts`
- **Dependências:** Nenhuma

### P1-10: Migrations Validação
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** Supabase migrations
- **Dependências:** Nenhuma

### P1-11: Deploy Runbook
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `backend/runbooks/deploy-e-rollback.md`
- **Dependências:** Nenhuma

### P1-12: Secret Scan em PR
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)
- **Iniciado:** (vazio)
- **Concluído:** (vazio)
- **Arquivo:** `.github/workflows/pr-checks.yml`
- **Dependências:** Nenhuma

---

## 🟡 TAREFAS MÉDIAS (P2) - 15 tarefas

### P2-1: Coverage > 80%
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)

### P2-2: pg_stat_statements Validação
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)

### P2-3: Índices Auditoria
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)

### P2-4: API Versionamento
- **Status:** 📝 PENDENTE
- **Agente:** (vazio)

### P2-5 a P2-15: (Listados no dossiê)
- **Status:** 📝 PENDENTE

---

## 🔵 TAREFAS BAIXAS (P3) - 8 tarefas

### P3-1: Dead Code Removal
- **Status:** 📝 PENDENTE

### P3-2: Dependências Update
- **Status:** 📝 PENDENTE

### P3-3 a P3-8: (Listados no dossiê)
- **Status:** 📝 PENDENTE

---

## 📊 RESUMO DE STATUS

| Prioridade | Total | Pendente | Em Progresso | Concluído |
|------------|-------|----------|--------------|----------|
| P0 | 8 | 8 | 0 | 0 |
| P1 | 12 | 11 | 0 | 0 |
| P2 | 15 | 15 | 0 | 0 |
| P3 | 8 | 8 | 0 | 0 |
| **TOTAL** | **43** | **42** | **0** | **0** |

---

## 🔄 HISTÓRICO DE ATUALIZAÇÕES

### 2026-04-06 21:55 - Inicialização
- Criado task tracker com 43 tarefas
- Status inicial: todas PENDENTE

---

## ⚠️ REGRAS DE COORDENAÇÃO

### 1. ANTES DE INICIAR
```bash
# 1. Atualizar repositório local
git pull origin main

# 2. Ler task tracker
cat IMPLANTAR/TASK-TRACKER.md

# 3. Verificar se tarefa está PENDENTE
grep "P0-1" IMPLANTAR/TASK-TRACKER.md

# 4. Se PENDENTE, atualizar para EM_PROGRESSO
# Editar TASK-TRACKER.md:
# Status: ⏳ EM_PROGRESSO
# Agente: [SEU NOME]
# Iniciado em: 2026-04-06 22:00

# 5. Commitar imediatamente
git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 iniciada por [AGENTE]"
git push
```

### 2. DURANTE EXECUÇÃO
- Agente deve fazer commits parciais a cada 30min
- Se bloquear por > 2h, marcar como BLOQUEADO

### 3. AO CONCLUIR
```bash
# 1. Atualizar task tracker
# Status: ✅ CONCLUIDO
# Concluído em: 2026-04-06 23:30
# Commit/PR: #123

# 2. Commitar
git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 concluída"
git push

# 3. Notificar próxima tarefa dependente
```

### 4. SE ENCONTRAR CONFLITO
```bash
# Outro agente pegou a tarefa entre seu pull e push?
# 1. Git pull
# 2. Ver quem está executando
# 3. Escolher OUTRA tarefa PENDENTE
# 4. NUNCA sobrescrever trabalho de outro agente
```

---

## 📞 COMUNICAÇÃO ENTRE AGENTES

### Canal: Este Arquivo (TASK-TRACKER.md)

**Exemplo de comunicação:**

```markdown
### P0-1: Multi-Tenancy
Status: ⏳ EM_PROGRESSO
Agente: AgenteSecurity
Iniciado: 2026-04-06 22:00
NOTA: Encontrei 3 tabelas sem RLS. Vou corrigir todas.
ETIMATIVA: 2h restantes
```

**Outro agente lê:**
"OK, P0-1 já está sendo feita. Vou pegar P0-2."

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
