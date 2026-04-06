# F0 — KICKOFF: Receitas Bell Backend Audit 2026-04

**Data:** 2026-04-06  
**Escopo:** Auditoria e roadmap executável do backend Receitas Bell  
**Metodologia:** Guia-mestre-backend-v2.md (processo F0-F9)  
**Horizonte de previsão:** 3 meses, 1 ano, 3 anos

---

## O QUE FOI INSPECIONADO (FATO)

### Repositório e Branch
- **Repo:** `mmatteuus/receitasbell`
- **Branch auditada:** `main` (SHA: `50387f5b328edd2d5fac188f446dadffa9d1a763`)
- **Data da última auditoria registrada:** Março/2026 (PROJETO_RECEITASBELL_STATUS.md)

### Stack e Runtime
- **Linguagem:** TypeScript + Node.js 20.x
- **Framework:** Vite (frontend) + Vercel Edge/Cloud Functions (backend)
- **Banco:** Supabase (PostgreSQL)
- **Pagamentos:** Stripe Checkout + Stripe Connect (multi-tenant)
- **Cache/Rate Limit:** Upstash Redis
- **Observabilidade:** Sentry (configurado mas não validado em produção)
- **Auth:** Magic Links + sessões server-side

### Estrutura do Backend
- **Rotas:** em `/api/` organizadas por domínio:
  - `/api/admin/*` - painel administrativo
  - `/api/auth/*` - autenticação e magic links
  - `/api/me/*` - área do cliente logado
  - `/api/payments/*` - checkout e webhooks Stripe
  - `/api/public/*` - catálogo e receitas públicas
  - `/api/jobs/*` - cron jobs e tarefas automáticas
  - `/api/health/*` - healthcheck
  - `/api/security/*` - CSP reports

- **Código backend:** em `/src/server/` com organização por domínio:
  - `auth/` - sessões, magic links, validação
  - `tenancy/` - resolução de tenant via subdomínio/header
  - `payments/` - Stripe Connect onboarding, checkout
  - `integrations/` - clientes Supabase e Stripe
  - `shared/` - utilitários HTTP, env, segurança

### Arquivos Críticos Encontrados
- ✅ `README.md` - documentação básica da arquitetura
- ✅ `PROJETO_RECEITASBELL_STATUS.md` - status pós-auditoria de março/2026
- ✅ `SECURITY.md` - política de disclosure responsável
- ✅ `package.json` - dependências e scripts
- ✅ `vercel.json` - config de deployment com CSP enforcement
- ✅ `.env.example` - variáveis de ambiente documentadas
- ✅ `renovate.json` - auto-update de dependências
- ✅ `.github/workflows` - CI/CD presente (não inspecionado em detalhe ainda)
- ✅ `/backend/checklists`, `/backend/compliance`, `/backend/runbooks` - estrutura parcial existente
- ❌ Falta: `/backend/prd`, `/backend/audit`, `/backend/contracts`, `/backend/tasks`, `/backend/handoff`

### Scripts Disponíveis
- `npm run gate` - lint + typecheck + build + test:unit (gate de produção)
- `npm run dev` - servidor de desenvolvimento
- `npm run build` - build de produção
- `npm run test:unit` - testes unitários com Vitest
- `npm run test:e2e` - testes E2E com Playwright
- `npm run typecheck` - validação TypeScript

### Segurança Observada
- ✅ CSP em modo enforcement (não report-only)
- ✅ Erros padronizados (RFC 7807 Problem Details)
- ✅ Correlation-id propagado
- ✅ Secrets não commitados (`.gitignore` adequado)
- ✅ SECURITY.md presente
- ✅ GitHub Actions com algumas actions fixadas por SHA
- ⚠️ SBOM não encontrado
- ⚠️ Secret scanning não validado em CI (precisa verificar workflows)
- ⚠️ Container scanning N/A (sem containers)

### Observabilidade
- ✅ Sentry configurado (DSN em .env.example)
- ✅ Logs estruturados via Logger (não validado no código ainda)
- ⚠️ SLI/SLO não definidos
- ⚠️ Alertas não configurados (dependem de Sentry em produção)
- ⚠️ Profiling não presente
- ⚠️ Métricas não expostas (nenhum endpoint /metrics encontrado)

### Testes
- ✅ Vitest configurado para testes unitários
- ✅ Playwright configurado para E2E
- ⚠️ Coverage não validado
- ⚠️ Testes de contrato (OpenAPI validation) não encontrados
- ⚠️ Testes de performance não encontrados

---

## O QUE NÃO FOI POSSÍVEL VALIDAR

### Código-Fonte Detalhado
- Implementação completa dos handlers em `/api/`
- Implementação dos serviços em `/src/server/`
- Validação de input (Zod schemas)
- Timeouts e retries em chamadas externas
- Connection pooling do Supabase
- Implementação de rate limiting (Upstash Redis)

### CI/CD Pipelines
- Conteúdo dos workflows em `.github/workflows`
- Gates de segurança (SAST, secret scan, dependency scan)
- Estratégia de deploy (canary, blue-green, rolling)
- SBOM generation pipeline

### Banco de Dados
- Schema atual do Supabase
- Índices existentes
- Policies de RLS (Row Level Security)
- Migrations e versionamento
- Connection pooling config

### Integrações Externas
- Configuração real do Stripe Connect
- Fluxo completo de onboarding de tenant
- Implementação de webhooks
- Retry e timeout em chamadas Stripe/Supabase/Upstash

### Deploy e Infraestrutura
- Config real da Vercel em produção
- Variáveis de ambiente em produção
- Logs e métricas em produção
- Alertas configurados

---

## RISCOS IMEDIATOS (próximos 30 dias)

### P0 — Crítico (ação imediata)
1. **Falta de SLI/SLO definidos** → sem error budget, sem burn-rate alerts, sem saber quando está em crise
2. **Ausência de SBOM** → não conformidade com supply chain security (EU CRA 2027 iminente)
3. **Observabilidade limitada** → dependência 100% do Sentry sem fallback, sem métricas próprias
4. **Testes de contrato ausentes** → OpenAPI pode divergir da implementação real

### P1 — Alto (próximos 7-14 dias)
5. **Connection pooling não validado** → risco de esgotamento de conexões Supabase em pico
6. **Rate limiting não validado** → implementação com Upstash não confirmada funcionando
7. **Timeouts não documentados** → chamadas externas sem timeout explícito são bomba-relógio
8. **Retry budgets ausentes** → risco de retry storms em falha parcial
9. **Feature flags ausentes** → rollback de comportamento exige deploy

### P2 — Médio (próximos 30 dias)
10. **Coverage de testes desconhecido** → pode ter gaps críticos
11. **Performance baselines ausentes** → p95/p99 não medidos
12. **Disaster recovery não testado** → RTO/RPO desconhecidos
13. **Compliance LGPD** → PII não mapeada, retenção não documentada, right-to-deletion não validado

---

## SUPOSIÇÕES MÍNIMAS REVERSÍVEIS

### SUPOSIÇÃO 1: Connection Pooling via Supabase-JS Default
**Motivo:** Não vimos configuração explícita de pooling  
**Risco:** Esgotamento de conexões em pico de tráfego  
**Reversibilidade:** Alta - adicionar configuração explícita  
**Impacto se errada:** P1 - indisponibilidade em pico  
**Prazo para validar:** 7 dias

### SUPOSIÇÃO 2: Rate Limiting Implementado via Upstash
**Motivo:** Upstash Redis presente em .env.example  
**Risco:** Endpoints sem proteção contra abuso  
**Reversibilidade:** Alta - confirmar implementação ou implementar  
**Impacto se errada:** P1 - abuso de API, custos elevados  
**Prazo para validar:** 7 dias

### SUPOSIÇÃO 3: Timeouts de 10s em Chamadas Externas
**Motivo:** Padrão conservador quando não especificado  
**Risco:** Timeout muito alto causa experiência ruim; muito baixo causa falsos negativos  
**Reversibilidade:** Média - exige mudança de código testada  
**Impacto se errada:** P1 - latência alta ou falhas intermitentes  
**Prazo para validar:** 7 dias

### SUPOSIÇÃO 4: Logs JSON Estruturados via Logger Próprio
**Motivo:** Menção no README, mas não validado  
**Risco:** Logs não parseáveis, observabilidade prejudicada  
**Reversibilidade:** Alta - padronizar logger  
**Impacto se errada:** P2 - troubleshooting lento  
**Prazo para validar:** 14 dias

### SUPOSIÇÃO 5: Deploy via Vercel CLI Automático no Main
**Motivo:** vercel.json configurado  
**Risco:** Deploy sem gates adequados  
**Reversibilidade:** Alta - adicionar gates no workflow  
**Impacto se errada:** P2 - deploy de código quebrado  
**Prazo para validar:** 14 dias

### SUPOSIÇÃO 6: Multi-Tenancy via `x-tenant-slug` Header ou Subdomínio
**Motivo:** Mencionado no README  
**Risco:** Isolamento de dados incorreto  
**Reversibilidade:** Baixa - arquitetura fundamental  
**Impacto se errada:** P0 - vazamento de dados entre tenants  
**Prazo para validar:** 3 dias (URGENTE)

---

## [PENDENTE] - Informações Críticas Ausentes

Nenhuma pendência crítica que bloqueie o avanço. Todas as suposições acima têm plano de validação.

---

## ESCOPO DESTA ANÁLISE

### Incluído
- Auditoria completa do backend (F0-F9)
- Checklist de 35 itens (roadmap.sh + OWASP + guia v2.0)
- Achados priorizados (P0-P3)
- Plano de implementação em fases com protocolo de não-quebra
- Runbooks operacionais
- Previsão de falhas futuras (3m/1a/3a)
- Snippets de código prontos para execução

### Excluído (fora do escopo)
- Frontend (Vite/React)
- Testes E2E detalhados
- Migração de stack
- Replatforming

---

## COMPLIANCE REQUIREMENTS IDENTIFICADOS

### LGPD (Lei 13.709/2018)
- **Aplicável:** Sim (plataforma processa dados de usuários brasileiros)
- **PII identificada:** email, nome, potencialmente CPF/documento em pagamentos
- **Ações necessárias:**
  - Mapear PII no banco
  - Documentar base legal para cada tipo de tratamento
  - Implementar right-to-deletion
  - Definir política de retenção
  - Audit logging para ações sensíveis

### GDPR (Regulation EU 2016/679)
- **Aplicável:** Potencialmente (se tiver usuários da UE)
- **Requisitos adicionais vs LGPD:** DPO quando aplicável, ROPA, breach notification 72h

### PCI-DSS
- **Aplicável:** Não diretamente (Stripe é PCI-compliant e não armazenamos dados de cartão)
- **Atenção:** Nunca logar dados de pagamento, mesmo parciais

---

## HORIZONTE DE PREVISÃO

- **3 meses:** Riscos operacionais e dívida técnica urgente
- **1 ano:** Crescimento, escala e manutenibilidade
- **3 anos:** Obsolescência de stack, compliance regulatório, arquitetura

---

## PRÓXIMOS PASSOS

Prosseguir para:
- **F1:** Checklist roadmap aplicado (35 itens)
- **F2:** Scanner do projeto (arquivos críticos)
- **F3:** Mapa do backend (módulos, rotas, dependências)
- **F4:** Trilha escolhida (A/B/C)
- **F5-F9:** Arquitetura, resiliência, observabilidade, runbooks, handoff

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
