# CONTEXTO PERMANENTE — Projeto Receitas Bell

**Última atualização:** 2026-04-06

## 🎯 PROPÓSITO

Contexto persistente para **qualquer agente IA** (Claude, GPT, Antigravity, OpenCode) que atuar neste projeto.

## 🏗️ ARQUITETURA

### Stack Tecnológica
- **Runtime:** Node.js 20 (Vercel Edge Functions)
- **Backend:** TypeScript + Vercel Serverless (`/api/`)
- **Frontend:** React 19 + Vite + TanStack Query
- **Database:** Supabase (PostgreSQL) com Row-Level Security
- **Payments:** Stripe Connect (Standard) + Mercado Pago
- **Auth:** Supabase Auth (JWT + Session Cookies)
- **Cache:** Upstash Redis
- **Email:** Resend
- **Deploy:** Vercel

### Credenciais Master (ADMIN)

**⚠️ CRÍTICO: Estas credenciais NUNCA mudam sem documentação aqui.**

- **Login Admin:** `admin@receitasbell.com`
- **Senha Admin:** `Receitasbell.com` (resetar via SQL se necessário)
- **Tenant Principal:** `receitasbell` (tenant_id=34)

### Pagamentos

**Estado atual:**
- Stripe: **modo TEST** (sk_test_... / pk_test_...)
- Mercado Pago: **ativo** (`receitasbell` conectado)

**Bloqueio para produção:**
- Stripe precisa migração para LIVE keys (tarefa via Antigravity no navegador)
- Mercado Pago já funcional

### Estrutura de Tenants

- **Tenant 34:** `receitasbell` (ativo, categorias seeded, Stripe conectado)
- **Tenant 3:** legado (NÃO usar)

### Tabelas Críticas (Supabase)

```sql
-- Core
tenants (id, name, stripe_account_id, mercadopago_access_token_encrypted)
receipts (id, tenant_id, title, price, stripe_product_id, stripe_price_id)
transactions (id, receipt_id, user_id, amount, status, payment_provider)

-- Auth
users (id, email, tenant_id, role)

-- OAuth states
stripe_oauth_states (state, tenant_id, created_at)
mercadopago_oauth_states (state, tenant_id, created_at)
```

## 🔐 SEGURANÇA

### Secrets Management
- **NUNCA** commitar `.env` ou arquivos com secrets
- Secrets em produção: Vercel Environment Variables
- Secrets locais: `.env.local` (gitignored)

### Compliance
- **LGPD:** PII mascarada em logs, retention policy definida
- **Audit Logging:** ações sensíveis logadas em `audit_logs` table

## 📋 PROCESSOS OBRIGATÓRIOS

### Antes de cada Deploy

```bash
npm run lint       # ESLint ok
npm run typecheck  # TypeScript ok
npm run build      # Build ok
npm run test:unit  # Testes ok
```

### Após Deploy

```bash
npm run smoke      # Smoke test básico
# Antigravity monitora logs Vercel por 15min
```

### Modificação de Schema SQL

1. Expand (adicionar coluna com DEFAULT)
2. Dual-write (código escreve em ambas)
3. Migrate data (script batch)
4. Contract (remover coluna antiga)

**NUNCA** `ALTER TABLE ... ADD COLUMN ... NOT NULL` sem DEFAULT.

## 🚨 BLOQUEIOS CONHECIDOS

1. **Stripe em TEST mode** — migração para LIVE depende de Antigravity acessar dashboard
2. **Senha admin perdida** — resetar via SQL: `UPDATE users SET password = crypt('Receitasbell.com', gen_salt('bf')) WHERE email = 'admin@receitasbell.com';`
3. **Tenant 3 vs 34** — sempre usar tenant_id=34 (receitasbell)

## 📦 DEPENDÊNCIAS CRÍTICAS

### Runtime
- `@vercel/node` — serverless handler
- `@supabase/supabase-js` — database client
- `stripe` — payments
- `@upstash/ratelimit` — rate limiting

### Security
- **GitHub Actions fixadas por SHA** (nunca por tag)
- **SBOM gerado** a cada release
- **Secret scanning** em CI

## 🎯 MISSÃO DOS AGENTES

### Claude (Orquestrador)
- Analisa código, encontra falhas, gera dossiês
- **NÃO executa código** (economizar tokens)
- Delega tarefas detalhadas para outros agentes

### OpenCode (Executor de Código)
- Recebe tarefas com snippets prontos
- Executa, testa, comita
- **NÃO decide arquitetura**

### Antigravity (Navegador + Deploy)
- Acessa dashboards (Stripe, Vercel, Supabase)
- Monitora deploys
- Faz configurações que exigem UI

### ChatGPT (Executor Alternativo)
- Backup do OpenCode quando necessário

## 📁 ESTRUTURA DESTA PASTA

```
IMPLANTAR/
  00-CONTEXTO-PERMANENTE.md     ← VOCÊ ESTÁ AQUI
  01-TAREFAS-ATIVAS.md          ← Fila de execução
  02-HISTORICO.md               ← O que já foi feito
  03-BLOQUEIOS.md               ← Impedimentos atuais
  tasks/                        ← Tarefas detalhadas por ID
    TASK-001-stripe-prod.md
    TASK-002-admin-reset.md
  dossies/                      ← Análises completas
    DOSSIE-STRIPE-2026-04-06.md
```

## ⚠️ REGRAS INVIOLÁVEIS

1. **Protocolo de Não-Quebra:** toda mudança que afeta funcionalidade existente exige feature flag
2. **Rollback em 1 comando:** `git revert HEAD && vercel --prod`
3. **Testes antes de commit:** lint + typecheck + build + test
4. **Deploys graduais:** canary 1% → 5% → 10% → 25% → 50% → 100%
5. **Monitoramento pós-deploy:** Antigravity monitora por 15min

## 📞 ASSINATURA

**Desenvolvido por MtsFerreira**  
Site: [mtsferreira.dev](https://mtsferreira.dev)

---

**FIM DO CONTEXTO PERMANENTE**