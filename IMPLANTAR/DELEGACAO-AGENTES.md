# Delegação de Agentes - Receitas Bell Backend

**Data:** 2026-04-06  
**Desenvolvido por:** MtsFerreira | [mtsferreira.dev](https://mtsferreira.dev)

---

## 🤖 Estrutura de Agentes

Cada agente tem um papel específico. Comunicação entre agentes acontece via pasta **IMPLANTAR/backend-audit-2026**.

---

## AGENTE 1: ARQUITETO PENSANTE

### Responsabilidades
- Analisar o backend completo
- Definir arquitetura e contratos
- Criar o dossiê completo (F0-F9)
- Priorizar achados (P0-P3)
- Definir protocolo de não-quebra
- Prever falhas futuras (3m/1a/3a)

### Input
- Repositório GitHub: `mmatteuus/receitasbell`
- Guia-mestre-backend-v2.md
- Fonte de API (fonte_de_api.md)

### Output
- `/IMPLANTAR/backend-audit-2026/*` (dossiê completo)
- Todos os arquivos F0-F9 + extras

### Prompt (máx 3 linhas)
```
Analise o backend de mmatteuus/receitasbell seguindo guia-mestre-backend-v2.md (processo F0-F9). Produza dossiê executavel completo em /IMPLANTAR/backend-audit-2026 com achados P0-P3, plano em fases, snippets prontos, protocolo de não-quebra e previsão de falhas (3m/1a/3a).
```

---

## AGENTE 2: EXECUTOR DE CÓDIGO

### Responsabilidades
- Implementar exatamente o que está no F9-HANDOFF.md
- Executar comandos copiar-e-colar
- Validar com critérios de aceite
- Executar rollback em caso de falha
- **NUNCA tomar decisões arquiteturais**

### Input
- `/IMPLANTAR/backend-audit-2026/F9-HANDOFF.md`
- `/IMPLANTAR/backend-audit-2026/ACHADOS-PRIORIZADOS.md` (para snippets)
- `/IMPLANTAR/backend-audit-2026/PROTOCOLO-NAO-QUEBRA.md`

### Output
- Código implementado
- Testes executados
- Logs de validação

### Prompt (máx 3 linhas)
```
Execute EXATAMENTE as tarefas em /IMPLANTAR/backend-audit-2026/F9-HANDOFF.md seguindo ordem, comandos e critérios de aceite. Use snippets de ACHADOS-PRIORIZADOS.md. Valide protocolo de não-quebra antes de cada mudança.
```

---

## AGENTE 3: AUDITOR DE SEGURANÇA

### Responsabilidades
- Validar achados de segurança (P0-P1)
- Executar scans (SAST, secret, dependency)
- Validar SBOM e supply chain
- Revisar RLS policies do Supabase
- Validar AuthN/AuthZ

### Input
- `/IMPLANTAR/backend-audit-2026/F1-CHECKLIST.md` (itens 11-21)
- `/IMPLANTAR/backend-audit-2026/ACHADOS-PRIORIZADOS.md` (achados de segurança)

### Output
- Relatório de scans
- Validação de RLS
- SBOM gerado

### Prompt (máx 3 linhas)
```
Valide itens de segurança (11-21) do checklist em /IMPLANTAR/backend-audit-2026/F1-CHECKLIST.md. Execute scans (trufflehog, Semgrep, npm audit), valide RLS policies do Supabase, gere SBOM com Syft.
```

---

## AGENTE 4: AUDITOR DE OBSERVABILIDADE

### Responsabilidades
- Implementar SLI/SLO definitions
- Configurar métricas Golden Signals
- Configurar alertas burn-rate no Sentry
- Validar logs estruturados
- Configurar profiling (se aplicável)

### Input
- `/IMPLANTAR/backend-audit-2026/F7-OBSERVABILIDADE.md`
- `/IMPLANTAR/backend-audit-2026/ACHADOS-PRIORIZADOS.md` (achados de obs)

### Output
- SLI/SLO documentados
- Alertas configurados
- Dashboard base no Sentry

### Prompt (máx 3 linhas)
```
Implemente observabilidade seguindo /IMPLANTAR/backend-audit-2026/F7-OBSERVABILIDADE.md: SLI/SLO (99.9% availability, p95 < 300ms), métricas Golden Signals, alertas burn-rate no Sentry, logs JSON com correlation-id.
```

---

## AGENTE 5: AUDITOR DE RESILIÊNCIA

### Responsabilidades
- Validar/implementar timeouts em dependências
- Implementar retries com exponential backoff + jitter
- Validar connection pooling do Supabase
- Implementar idempotência (Idempotency-Key)
- Validar rate limiting (Upstash)

### Input
- `/IMPLANTAR/backend-audit-2026/F6-RESILIENCIA.md`
- `/IMPLANTAR/backend-audit-2026/ACHADOS-PRIORIZADOS.md` (achados de resiliência)

### Output
- Tabela de timeouts por dependência
- Retry configs documentadas
- Idempotência validada

### Prompt (máx 3 linhas)
```
Implemente resiliência seguindo /IMPLANTAR/backend-audit-2026/F6-RESILIENCIA.md: timeouts explícitos (Supabase 10s, Stripe 10s, Upstash 500ms), retries com backoff+jitter (max 3x), connection pooling validado, idempotência com Redis.
```

---

## AGENTE 6: AUDITOR DE COMPLIANCE

### Responsabilidades
- Mapear PII no banco (email, nome, cpf)
- Documentar base legal LGPD
- Implementar right-to-deletion
- Definir política de retenção
- Configurar audit logging

### Input
- `/IMPLANTAR/backend-audit-2026/F0-KICKOFF.md` (seção compliance)
- `/backend/compliance/*` (se existir)

### Output
- `/backend/compliance/pii-mapping.md`
- `/backend/compliance/data-retention-policy.md`
- `/backend/compliance/gdpr-lgpd-checklist.md`

### Prompt (máx 3 linhas)
```
Mapear PII (email, nome, cpf) no Supabase, documentar base legal LGPD para cada tratamento, definir retenção (90d sessões, 5a transações), implementar script de right-to-deletion, criar audit log schema.
```

---

## AGENTE 7: REVISOR DE CONTRATOS

### Responsabilidades
- Criar/atualizar OpenAPI 3.1 completo
- Validar aderência ao RFC 7807 (erros)
- Documentar paginação cursor-based
- Implementar Sunset Header para deprecated
- Criar testes de contrato (Prism/Spectral)

### Input
- `/IMPLANTAR/backend-audit-2026/F5-ARQUITETURA.md`
- `/openapi/*` (se existir)

### Output
- `/openapi/openapi.yaml` (completo e atualizado)
- Testes de contrato passando

### Prompt (máx 3 linhas)
```
Criar OpenAPI 3.1 completo para todas as rotas em /api seguindo /IMPLANTAR/backend-audit-2026/F5-ARQUITETURA.md. Incluir RFC 7807 errors, cursor pagination, Sunset Header. Validar com Spectral.
```

---

## AGENTE 8: EXECUTOR DE RUNBOOKS

### Responsabilidades
- Documentar deploy canary (1%→5%→10%→25%→50%→100%)
- Documentar rollback em 1 comando
- Criar runbook de incidente (framework IMAG)
- Criar runbook de disaster recovery
- Criar checklists operacionais

### Input
- `/IMPLANTAR/backend-audit-2026/F8-RUNBOOKS.md`

### Output
- `/backend/runbooks/deploy-e-rollback.md`
- `/backend/runbooks/incidente.md`
- `/backend/runbooks/disaster-recovery.md`

### Prompt (máx 3 linhas)
```
Documentar runbooks seguindo /IMPLANTAR/backend-audit-2026/F8-RUNBOOKS.md: deploy canary com schedule, rollback em 1 comando (git revert + vercel), incidente IMAG (IC/Comms/Ops), DR com RTO<15min RPO<5min.
```

---

## FLUXO DE TRABALHO RECOMENDADO

### Fase 1: Planejamento (Agente 1)
1. Agente Arquiteto Pensante analisa repositório
2. Produz dossiê completo em `/IMPLANTAR/backend-audit-2026`
3. Prioriza achados (P0 → P1 → P2 → P3)

### Fase 2: Execução Paralela (Agentes 3-8)
4. Agentes especializados executam em paralelo:
   - Agente 3: Segurança (P0-P1)
   - Agente 4: Observabilidade (P0)
   - Agente 5: Resiliência (P0-P1)
   - Agente 6: Compliance (P1-P2)
   - Agente 7: Contratos (P1)
   - Agente 8: Runbooks (P1-P2)

### Fase 3: Implementação (Agente 2)
5. Agente Executor implementa mudanças seguindo F9-HANDOFF.md
6. Valida cada mudança com protocolo de não-quebra
7. Executa testes e critérios de aceite

### Fase 4: Validação Final (Agente 1)
8. Agente Arquiteto revisa implementação
9. Valida que todos os P0-P1 foram resolvidos
10. Atualiza dossiê com status final

---

## COMUNICAÇÃO ENTRE AGENTES

TODOS os agentes comunicam via **pasta IMPLANTAR/backend-audit-2026**:

### Agente 1 → Todos
- Cria dossiê completo
- Define prioridades
- Fornece direção

### Agentes 3-8 → Agente 2
- Escrevem achados detalhados em ACHADOS-PRIORIZADOS.md
- Fornecem snippets prontos para execução
- Documentam critérios de aceite

### Agente 2 → Agente 1
- Reporta progressão
- Sinaliza bloqueios
- Confirma conclusão de fases

### Formato de Comunicação
Todos os agentes DEVEM atualizar arquivos em `/IMPLANTAR/backend-audit-2026` com:
- Status de execução (TODO/IN_PROGRESS/DONE/BLOCKED)
- Evidência de conclusão (logs, outputs, screenshots)
- Próximos passos claros

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
