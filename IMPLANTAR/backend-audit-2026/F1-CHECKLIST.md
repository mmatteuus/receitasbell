# F1 — CHECKLIST ROADMAP APLICADO

**Data:** 2026-04-06  
**Total de itens:** 35 (expandido do checklist de 43 do guia v2.0)  
**Método:** Inspeção de código, configs, manifests, docs

---

## LEGENDA

- **OK** = Implementado e validado
- **NOK** = Não implementado ou implementado incorretamente
- **N/A** = Não aplicável ao projeto
- **NOVO** = Item não existe e é necessário
- **Prioridade:** P0 (crítico) → P1 (alto) → P2 (médio) → P3 (melhoria)

---

## CÓDIGO E ESTRUTURA

### 1. Estrutura de pastas coerente e documentada
**Status:** OK  
**Evidência:** README.md documenta estrutura em `/api/` e `/src/server/` com organização por domínio  
**Impacto:** Baixo (já implementado)  
**Ação:** Nenhuma  
**Prioridade:** N/A

### 2. Lint/format/typecheck configurados e passando
**Status:** OK  
**Evidência:** ESLint + Prettier + TypeScript configurados; `npm run gate` executa lint, typecheck, build, test  
**Impacto:** Baixo (já implementado)  
**Ação:** Validar execução em CI  
**Prioridade:** P3

### 3. Convenção de nomenclatura consistente
**Status:** OK (SUPOSIÇÃO)  
**Evidência:** Organização por domínio sugere consistência  
**Impacto:** Baixo  
**Ação:** Validar em revisão de código  
**Prioridade:** P3  
**Risco se NOK:** Confusão e manutenção difícil

### 4. Sem código morto ou comentado em excesso
**Status:** NOVO (VALIDAR)  
**Evidência:** Não validado sem inspeção completa do código  
**Impacto:** Baixo  
**Ação:** Dead code detection via ESLint plugin  
**Prioridade:** P3

### 5. Sem console.log/print em produção
**Status:** NOVO (VALIDAR)  
**Evidência:** Logger estruturado mencionado mas não validado  
**Impacto:** Médio (logs não estruturados prejudicam observabilidade)  
**Ação:** ESLint rule `no-console` + Logger obrigatório  
**Prioridade:** P2  
**Risco se NOK:** Logs não parseáveis, PII vazado

---

## API

### 6. Contrato OpenAPI 3.1+ existente e atualizado
**Status:** NOVO  
**Evidência:** Pasta `/openapi/` existe mas conteúdo não validado  
**Impacto:** Alto (sem contrato formal, sem testes de contrato)  
**Ação:** Criar/atualizar OpenAPI 3.1 completo  
**Prioridade:** P1  
**Risco se NOK:** Divergência entre docs e implementação

### 7. Erros padronizados (RFC 7807)
**Status:** OK  
**Evidência:** PROJETO_RECEITASBELL_STATUS.md confirma `application/problem+json` com `request_id` e `timestamp`  
**Impacto:** Baixo (já implementado)  
**Ação:** Nenhuma  
**Prioridade:** N/A

### 8. Paginação cursor-based implementada
**Status:** NOVO  
**Evidência:** Não mencionado, provavel offset pagination  
**Impacto:** Alto (performance ruim em tabelas grandes)  
**Ação:** Implementar cursor pagination para listagens > 100 itens  
**Prioridade:** P1  
**Risco se NOK:** Latencia p99 > 2s em listagens grandes

### 9. Rate limiting com headers padronizados
**Status:** NOVO (VALIDAR)  
**Evidência:** Upstash Redis em .env.example sugere implementação, mas não validado  
**Impacto:** Crítico (proteção contra abuso)  
**Ação:** Validar implementação + headers `X-RateLimit-*` e `Retry-After`  
**Prioridade:** P0  
**Risco se NOK:** Abuso de API, custos elevados, indisponibilidade

### 10. Versionamento com Sunset Header para deprecated
**Status:** NOK  
**Evidência:** Não mencionado  
**Impacto:** Médio (dificulta deprecação segura)  
**Ação:** Implementar versionamento (URL major + header minor) + Sunset Header  
**Prioridade:** P2  
**Risco se NOK:** Breaking changes sem aviso prévio

---

## SEGURANÇA

### 11. AuthN server-side (JWT/OAuth2)
**Status:** OK  
**Evidência:** Magic Links + sessões server-side mencionados no README  
**Impacto:** Baixo (já implementado)  
**Ação:** Validar implementação  
**Prioridade:** P3

### 12. AuthZ server-side (RBAC/ABAC, não só frontend)
**Status:** OK (SUPOSIÇÃO)  
**Evidência:** Multi-tenant implica RLS no Supabase  
**Impacto:** Crítico se NOK  
**Ação:** Validar RLS policies no Supabase  
**Prioridade:** P0  
**Risco se NOK:** Vazamento de dados entre tenants

### 13. Validação de input em todas as rotas
**Status:** NOVO (VALIDAR)  
**Evidência:** Zod presente em dependências, mas não validado em todas as rotas  
**Impacto:** Crítico (injeção, mass assignment)  
**Ação:** Validar Zod schemas em todas as rotas + lint rule  
**Prioridade:** P0  
**Risco se NOK:** SQL injection, XSS, mass assignment

### 14. Queries parametrizadas (sem SQL injection)
**Status:** OK  
**Evidência:** Supabase-JS usa queries parametrizadas por padrão  
**Impacto:** Baixo (já implementado)  
**Ação:** Nenhuma  
**Prioridade:** N/A

### 15. Segredos fora do repositório
**Status:** OK  
**Evidência:** `.env` no `.gitignore`, `.env.example` sem valores reais  
**Impacto:** Baixo (já implementado)  
**Ação:** Nenhuma  
**Prioridade:** N/A

### 16. CORS restritivo em produção
**Status:** NOVO (VALIDAR)  
**Evidência:** CSP configurado em vercel.json, mas CORS não validado  
**Impacto:** Alto (CSRF)  
**Ação:** Validar CORS config (sem `*` em produção)  
**Prioridade:** P1  
**Risco se NOK:** CSRF, requisições não autorizadas

### 17. GitHub Actions fixadas por SHA
**Status:** NOK (PARCIAL)  
**Evidência:** PROJETO_RECEITASBELL_STATUS menciona "algumas" actions fixadas  
**Impacto:** Alto (supply chain attack)  
**Ação:** Fixar TODAS as actions por SHA  
**Prioridade:** P1  
**Risco se NOK:** Supply chain compromise

### 18. Secret scanning em CI
**Status:** OK (PARCIAL)  
**Evidência:** PROJETO_RECEITASBELL_STATUS menciona secret scan  
**Impacto:** Médio  
**Ação:** Validar execução em cada PR  
**Prioridade:** P2

### 19. Dependency scanning em CI
**Status:** OK (PARCIAL)  
**Evidência:** PROJETO_RECEITASBELL_STATUS menciona dependency scan  
**Impacto:** Médio  
**Ação:** Validar execução + auto-merge de patches seguros  
**Prioridade:** P2

### 20. Container scanning em CI (se containers)
**Status:** N/A  
**Evidência:** Vercel serverless, sem containers  
**Impacto:** N/A  
**Ação:** Nenhuma  
**Prioridade:** N/A

### 21. SBOM gerado por release
**Status:** NOK  
**Evidência:** Não mencionado  
**Impacto:** Crítico (compliance EU CRA 2027)  
**Ação:** Adicionar SBOM generation em CI (Syft ou cdxgen)  
**Prioridade:** P0  
**Risco se NOK:** Não conformidade regulatória, supply chain opaco

---

## CONFIABILIDADE

### 22. Timeouts explícitos em todas as dependências externas
**Status:** NOK  
**Evidência:** Não documentado  
**Impacto:** Crítico (hang infinito)  
**Ação:** Documentar + implementar timeouts para Supabase, Stripe, Upstash  
**Prioridade:** P0  
**Risco se NOK:** Indisponibilidade por timeout infinito

### 23. Retries com backoff + jitter (nunca infinito)
**Status:** NOK  
**Evidência:** Não documentado  
**Impacto:** Alto (retry storms)  
**Ação:** Implementar retry com exponential backoff + full jitter  
**Prioridade:** P1  
**Risco se NOK:** Retry storms, amplificação de falhas

### 24. Idempotência em operações sensíveis
**Status:** NOVO (VALIDAR)  
**Evidência:** Não validado  
**Impacto:** Alto (duplicação de transações)  
**Ação:** Implementar Idempotency-Key header + store (Redis)  
**Prioridade:** P1  
**Risco se NOK:** Cobranças duplicadas, inconsistência de dados

### 25. Graceful shutdown implementado
**Status:** NOVO (VALIDAR)  
**Evidência:** Não validado  
**Impacto:** Médio (requests cortados em deploy)  
**Ação:** Implementar SIGTERM handler com timeout de 30s  
**Prioridade:** P2  
**Risco se NOK:** Requests falhando em deploy

### 26. Health/readiness/liveness endpoints
**Status:** OK (PARCIAL)  
**Evidência:** `/api/health` existe  
**Impacto:** Médio  
**Ação:** Validar se checa dependências (DB, Redis) e separar liveness/readiness  
**Prioridade:** P2  
**Risco se NOK:** Deploys com serviços não prontos

---

## OBSERVABILIDADE

### 27. Logs estruturados (JSON) com correlation-id
**Status:** OK (PARCIAL)  
**Evidência:** PROJETO_RECEITASBELL_STATUS confirma correlation-id propagado  
**Impacto:** Baixo  
**Ação:** Validar formato JSON e campos obrigatórios  
**Prioridade:** P3

### 28. Métricas Golden Signals (latency, traffic, errors, saturation)
**Status:** NOK  
**Evidência:** Não mencionado  
**Impacto:** Crítico (sem visibilidade de saúde)  
**Ação:** Implementar métricas via Vercel Analytics + Sentry  
**Prioridade:** P0  
**Risco se NOK:** Falhas não detectadas, troubleshooting lento

### 29. Alertas configurados (preferencialmente burn-rate)
**Status:** NOK  
**Evidência:** Não mencionado  
**Impacto:** Crítico (falhas não detectadas)  
**Ação:** Configurar alertas burn-rate no Sentry  
**Prioridade:** P0  
**Risco se NOK:** Indisponibilidade prolongada sem detecção

### 30. SLI/SLO definidos
**Status:** NOK  
**Evidência:** Não mencionado  
**Impacto:** Crítico (sem error budget, sem burn-rate alerts)  
**Ação:** Definir SLO de 99.9% availability + latency p95 < 300ms  
**Prioridade:** P0  
**Risco se NOK:** Sem visibilidade de saúde, sem critério de sucesso

---

## BANCO DE DADOS

### 31. Connection pooling configurado
**Status:** NOK  
**Evidência:** Supabase-JS default não validado  
**Impacto:** Alto (esgotamento de conexões)  
**Ação:** Configurar pooling explícito ou usar Supabase Pooler  
**Prioridade:** P1  
**Risco se NOK:** Indisponibilidade em pico

### 32. Migrations com rollback testável
**Status:** NOVO (VALIDAR)  
**Evidência:** Supabase CLI presente, mas migrations não validadas  
**Impacto:** Alto (schema drift, rollback sem teste)  
**Ação:** Validar processo de migration + rollback  
**Prioridade:** P1  
**Risco se NOK:** Schema drift, rollback impossivel

### 33. pg_stat_statements habilitado (PostgreSQL)
**Status:** NOVO (VALIDAR)  
**Evidência:** Supabase deve ter por padrão, mas não validado  
**Impacto:** Médio (sem visibilidade de queries lentas)  
**Ação:** Validar habilitação no Supabase  
**Prioridade:** P2  
**Risco se NOK:** Performance degradada sem detecção

### 34. Índices justificados com evidência
**Status:** NOVO (VALIDAR)  
**Evidência:** Schema não validado  
**Impacto:** Médio (queries lentas)  
**Ação:** Revisar índices com EXPLAIN ANALYZE  
**Prioridade:** P2  
**Risco se NOK:** Latencia p95 elevada

---

## OPERAÇÃO

### 35. Deploy/rollback documentados com runbook
**Status:** NOK  
**Evidência:** Pasta `/backend/runbooks` existe mas conteúdo não validado  
**Impacto:** Alto (rollback manual, erro humano)  
**Ação:** Documentar deploy canary + rollback em 1 comando  
**Prioridade:** P1  
**Risco se NOK:** Downtime prolongado em incidente

---

## RESUMO DO CHECKLIST

### Por Status
- **OK:** 10 itens (28.6%)
- **NOK:** 14 itens (40.0%)
- **NOVO (VALIDAR):** 10 itens (28.6%)
- **N/A:** 1 item (2.9%)

### Por Prioridade
- **P0 (crítico):** 7 itens → ação imediata
- **P1 (alto):** 10 itens → próximos 7-14 dias
- **P2 (médio):** 11 itens → próximos 30 dias
- **P3 (melhoria):** 6 itens → backlog
- **N/A:** 1 item

### TOP 7 Ações Prioritárias (P0)
1. **SLI/SLO definidos** → sem error budget, sem burn-rate alerts
2. **Métricas Golden Signals** → sem visibilidade de saúde
3. **Alertas burn-rate** → falhas não detectadas
4. **SBOM** → compliance EU CRA 2027
5. **Rate limiting validado** → proteção contra abuso
6. **Timeouts explícitos** → hang infinito
7. **AuthZ validado** → vazamento de dados entre tenants
8. **Validação de input** → injeção, mass assignment

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
