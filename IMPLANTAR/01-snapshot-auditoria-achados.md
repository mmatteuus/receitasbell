# Snapshot do Backend, Checklist Aplicado e Achados Priorizados

---

## 1. Snapshot técnico do backend

### Stack e runtime
- **Linguagem:** TypeScript / Node.js
- **Frontend/build:** Vite + React
- **Hospedagem:** Vercel
- **Storage operacional:** Baserow
- **Pagamentos:** Mercado Pago + Stripe
- **Observabilidade declarada:** logger estruturado + Sentry citado no README
- **Rate limit:** Upstash Redis com fallback em memória
- **PWA:** `vite-plugin-pwa`

### Execução atual
- `npm run gate` = lint + typecheck + build + test:unit
- Vercel usa `npm run gate` como build command
- O projeto declara Node `20.x` no `package.json`, mas o ambiente Vercel observado ficou divergente em configuração operacional anterior

### Arquivos-chave confirmados
- `README.md`
- `.env.example`
- `package.json`
- `vercel.json`
- `src/server/shared/env.ts`
- `src/server/auth/sessions.ts`
- `src/server/auth/magicLinks.ts`
- `src/server/admin/payments.ts`
- `api_handlers/admin/payments.ts`
- `api_handlers/admin/payments/settings.ts`
- `src/server/integrations/mercadopago/client.ts`
- `src/server/integrations/mercadopago/connections.ts`
- `src/server/payments/repo.ts`
- `src/pages/AccountHome.tsx`
- testes admin Mercado Pago/readiness

---

## 2. F1 — Checklist roadmap aplicado

| Item | Status | Evidência | Impacto | Ação | Prioridade |
|---|---|---|---|---|---|
| Multi-tenant existe | OK | código + tabelas `Tenants`/`Users` | base correta | preservar | P2 |
| Sessão server-side existe | OK | `sessions.ts` | reaproveitamento forte | reutilizar | P1 |
| Login admin isolado | OK | handlers admin + sessão | evita regressão | não tocar na fase social | P0 |
| Magic link existe | OK | `magicLinks.ts`, request/verify | fallback pronto | manter e endurecer | P1 |
| `/api/auth/me` existe | OK | handler encontrado | fonte de verdade p/ sessão | reaproveitar | P1 |
| Readiness de pagamentos existe | OK | `admin/payments.ts` + testes | base boa | preservar e corrigir drift | P1 |
| Testes admin MP existem | OK | `tests/admin-payments-readiness.test.ts`, `admin-mercadopago-connect.spec.ts` | reduz risco | atualizar se necessário | P2 |
| Build command definido | OK | `vercel.json` | operação clara | manter | P3 |
| Rate limit distribuído existe | OK | `rateLimit.ts` | boa base | endurecer pontos críticos | P1 |
| Fallback memory no rate limit | NOK | `rateLimit.ts` | risco em prod | bloquear em auth social | P1 |
| Merge conflict commitado | NOK | `mercadopago/client.ts` | bloqueia build | corrigir primeiro | P0 |
| Payment Orders com lixo operacional | NOK | tabela real com linhas placeholder | quebra listagem admin | sanear dados + tolerância no código | P1 |
| Conexões MP com drift legado | NOK | tabela real + código endurecido | quebra settings/status | normalizar conexões | P1 |
| PWA icon válido no deploy | NOK | warning do browser | quebra instalação PWA | corrigir assets/build | P1 |
| OAuth social de usuário final | NOK | `AccountHome.tsx` ainda transitório | funcionalidade faltante | implementar | P0 |
| Tabela própria de OAuth social | NOVO | não localizada | necessária | criar | P1 |
| Tabela própria de identities sociais | NOVO | não localizada | necessária | criar | P1 |
| Sessions em Baserow real | OK | tabela real existe | bom para revogação | exigir em produção | P1 |
| Magic links em Baserow real | OK | tabela real existe | fluxo pronto | revisar semântica de expiração | P1 |
| OpenAPI versionado | NOK | não localizado | contrato fraco | gerar | P2 |
| SECURITY.md / SBOM pipeline | [PENDENTE] | não confirmado | supply chain | criar se ausente | P2 |
| Segredos só em secret manager | NOK | material sensível encontrado em dados operacionais | risco crítico | rotacionar e sanejar | P0 |
| PII mapeada formalmente | NOK | não localizado documento | compliance | gerar | P2 |
| Runbook formal de rollback | NOK | não localizado | risco operacional | gerar | P1 |

---

## 3. F2 — Scanner do projeto

### README / package / vercel
O projeto já se descreve como multi-tenant, TypeScript/Node, Vercel, Baserow e Mercado Pago. O gate de produção está amarrado a `npm run gate`.

### env parsing
O parser de env já cobre:
- Baserow
- auth/session
- Mercado Pago
- Stripe
- tabelas principais
- rate limit

O que falta para a próxima fase:
- envs de OAuth social
- envs documentadas de hardening/feature flag
- maior alinhamento entre env crítica e readiness por domínio

### auth/session
A base de sessões já é boa:
- cookie seguro
- fallback stateless
- revogação quando a tabela existe
- armazenamento de IP/user-agent

### magic link
O fluxo existe, mas o schema de expiração precisa verificação operacional.

### admin payments
A rota e a regra de readiness existem; o problema é operacional/drift, não ausência de rota.

### Mercado Pago
Há cliente HTTP dedicado e há módulo de connections endurecido; o problema não é ausência de integração, e sim **estado quebrado entre código e storage**.

### tests
Existem testes unitários e E2E cobrindo readiness/admin Mercado Pago, o que prova que o desenho esperado já está minimamente explicitado.

---

## 4. F3 — Mapa do backend

## Módulos principais
- `auth`
- `admin`
- `payments`
- `integrations/baserow`
- `integrations/mercadopago`
- `settings`
- `tenancy`
- `shared`

## Rotas principais observadas
- `/api/auth/request-magic-link`
- `/api/auth/verify-magic-link`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/admin/auth/session`
- `/api/admin/payments`
- `/api/admin/payments/settings`
- `/api/admin/mercadopago/:action`
- `/api/checkout/*`
- `/api/health`
- `/api/health/ready`

## Dependências externas
- Baserow
- Mercado Pago
- Stripe
- Upstash Redis
- Email provider
- Vercel runtime

## Dados sensíveis / PII map
- email
- userId
- tenantId
- IP
- user-agent
- tokens de conexão Mercado Pago
- possíveis credenciais operacionais persistidas em Settings

### Risco de compliance
- presença de identificadores pessoais e operacionais sem dossiê formal de retenção
- necessidade de mascaramento e rotação
- necessidade de trilha LGPD/GDPR

---

## 5. Top 3 fluxos críticos

## Fluxo 1 — Admin pagamentos / settings
```mermaid
flowchart LR
A[Admin autenticado] --> B[/api/admin/payments/settings]
B --> C[requireTenantFromRequest]
C --> D[requireAdminAccess]
D --> E[getTenantAdminPaymentSettings]
E --> F[getSettingsMap]
E --> G[getTenantMercadoPagoConnection]
E --> H[hasMercadoPagoAppConfigAsync]
E --> I[hasMercadoPagoWebhookSecretAsync]
E --> J[Payload de readiness]
```

### Pontos de falha
- Drift de rows do MP
- Settings inconsistente
- segredo/config detectado mas com shape legado
- exception ao montar payload final

## Fluxo 2 — Admin pagamentos / listagem
```mermaid
flowchart LR
A[Admin autenticado] --> B[/api/admin/payments]
B --> C[requireTenantFromRequest]
C --> D[requireAdminAccess]
D --> E[listPayments]
E --> F[Payment Orders]
E --> G[Recipes]
E --> H[Payment Events]
E --> I[Filtro por data/status]
```

### Pontos de falha
- rows placeholder/inválidas
- enrich com dados faltantes
- filtro por data em payload malformado
- sorting em dados nulos

## Fluxo 3 — Usuário final / Minha Conta
```mermaid
flowchart LR
A[Usuario entra em /minha-conta] --> B{Tem identidade?}
B -- nao --> C[Input email local]
C --> D[updateIdentity]
D --> E[Visão de conta]
B -- sim --> E
```

### Pontos de falha
- identidade local não equivale a autenticação real
- inconsistência entre cliente e servidor
- ausência de vínculo social real
- risco de colisão por tenant/email

---

## 6. Heat map de risco

| Domínio | Severidade | Motivo |
|---|---:|---|
| Build/deploy | P0 | merge conflict commitado |
| Mercado Pago admin | P1 | drift código ↔ dados |
| Payment Orders admin | P1 | dados inválidos quebrando listagem |
| OAuth social usuário final | P0 | funcionalidade ainda incompleta |
| Magic link | P1 | expiração potencialmente ambígua |
| PWA icon | P1 | asset quebrado em produção |
| Supply chain / segredos | P0 | material sensível em storage operacional |

---

## 7. Achados priorizados P0–P3

## P0 — Merge conflict commitado em `mercadopago/client.ts`
**Problema:** build parser quebra antes da aplicação sequer entrar de pé.  
**Causa provável:** merge manual incompleto entre versões de `mpGetPaymentMethods`.  
**Correção:** consolidar uma única implementação compatível com `methods.ts`.  
**Risco de rollout:** baixo, porque é correção de sintaxe + contrato esperado.  
**Feature flag:** não.  
**Reversibilidade:** alta.

## P0 — OAuth social ainda não concluído
**Problema:** `AccountHome.tsx` ainda trabalha com identidade local transitória.  
**Impacto:** funcionalidade de conta do usuário final fica incompleta e frágil.  
**Correção:** criar domínio social auth reutilizando `createSession()` e `auth/me`.  
**Risco de rollout:** médio.  
**Feature flag:** sim.  
**Reversibilidade:** alta.

## P0 — Material sensível em storage operacional
**Problema:** foi constatada existência de material operacional sensível em Baserow.  
**Impacto:** risco de vazamento, drift, ausência de rotação, superfícies desnecessárias.  
**Correção:** rotação, minimização, limpeza e migração para fluxo seguro.  
**Risco:** alto se ignorado.  
**Feature flag:** não.  
**Reversibilidade:** média.

## P1 — `payments/settings` quebra após autenticação
**Problema:** endpoint existente cai a 500 quando deveria montar payload de readiness.  
**Correção:** normalizar dados reais das conexões Mercado Pago e endurecer leitura.  
**Feature flag:** não.  
**Reversibilidade:** média.

## P1 — `payments` quebra com linhas placeholder
**Problema:** Payment Orders contém rows inúteis/nulas.  
**Correção:** sanear storage + ignorar rows inválidas em código.  
**Feature flag:** não.  
**Reversibilidade:** alta.

## P1 — Warning do ícone PWA
**Problema:** asset quebrado ou não entregue corretamente.  
**Correção:** validar arquivos, build output e MIME.  
**Feature flag:** não.  
**Reversibilidade:** alta.

## P1 — Magic link com semântica de expiração suspeita
**Problema:** TTL curto no código, persistência possivelmente date-only.  
**Correção:** inspeção de schema + expand-contract se necessário.  
**Feature flag:** não.  
**Reversibilidade:** média.

## P2 — OpenAPI e documentação operacional incompletas
**Correção:** gerar contratos e runbooks formais.  
**Reversibilidade:** alta.

## P2 — Supply chain/compliance documental fraco
**Correção:** SBOM, security checklist, PII mapping, retention, audit schema.  
**Reversibilidade:** alta.
