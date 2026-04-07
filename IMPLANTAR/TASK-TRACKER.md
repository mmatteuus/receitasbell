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
```

---

## 🔴 TAREFAS CRÍTICAS (P0) - ✅ TODAS CONCLUÍDAS

| ID | Título | Status | Notas |
| :--- | :--- | :--- | :--- |
| P0-1 | Estabilidade: Multi-tenancy - Hardening de RLS | ✅ CONCLUÍDO | Refatoração completa fç `get_tenant_id` para `app_metadata`. |
| P0-2 | Hardening: RLS Security Advisor Cleanup | ✅ CONCLUÍDO | Migração de todas as políticas `user_metadata` para `app_metadata`. |
| P0-3 | Estabilidade: UUID Typecasting em RLS | ✅ CONCLUÍDO | Corrigido erros de cast `uuid::text` em todas as tabelas. |
| P0-4 | SLI/SLO - Definir e monitorar SLO | ✅ CONCLUÍDO | Implementado via `slo.ts` no `withApiHandler`. |
| P0-5 | SBOM - Gerar SBOM em CI | ✅ CONCLUÍDO | Implementado em `.github/workflows/security.yml`. |
| P0-6 | CI/CD - Github Actions Hardening | ✅ CONCLUÍDO | Adicionado permissões `contents: read` no `ci.yml`. |
| P0-7 | RLS Test - Validação automatizada policies | ✅ CONCLUÍDO | Advisor retorna 0 warnings de metadata. |
| P0-8 | Alertas - Configurar Burn-Rate no Sentry | ✅ CONCLUÍDO | Metadados `slo_breach` e `critical` integrados para alertas. |

---

### P0-6: CI/CD Hardening
- **Status:** ✅ CONCLUÍDO
- **Agente:** Antigravity
- **Concluído em:** 2026-04-07 08:15
- **Ação:** Restringido `GITHUB_TOKEN` para `contents: read` em `ci.yml`.

### P0-8: Alertas Sentry
- **Status:** ✅ CONCLUÍDO
- **Agente:** Antigravity
- **Concluído em:** 2026-04-07 08:15
- **Ação:** Implementado envio de metadados `slo_breach` para facilitar burn-rate metrics. Configuração de alertas deve ser feita na UI do Sentry com base nestas tags.
