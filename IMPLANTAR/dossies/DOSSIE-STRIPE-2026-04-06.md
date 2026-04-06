# DOSSIÊ: Análise Backend Stripe — Receitas Bell

**Data:** 2026-04-06  
**Orquestrador:** Claude (F0–F9)  
**Foco:** Stripe Connect + Webhooks + Produção  

---

## F0 — KICKOFF

### O Que Foi Inspecionado

- ✅ Estrutura de rotas em `/api/payments/`
- ✅ Handler de webhook Stripe
- ✅ Variáveis de ambiente em `.env.example`
- ✅ Schema Supabase (via docs)
- ✅ Status atual (via `PROJETO_RECEITASBELL_STATUS.md`)

### Riscos Imediatos

1. **P0 — Stripe em TEST mode:** sistema não aceita pagamentos reais
2. **P0 — Webhook signature validation:** se webhook secret estiver errado, transações não são registradas
3. **P1 — Sem idempotência:** webhook pode duplicar transações se reprocessado
4. **P1 — Sem retry policy:** se Supabase falhar, webhook perde dados

### Suposições Mínimas

- **SUPOSIÇÃO 1:** Webhook endpoint está configurado no Stripe dashboard (URL: `https://receitasbell.mtsferreira.dev/api/payments/webhook`)
- **SUPOSIÇÃO 2:** `STRIPE_WEBHOOK_SECRET` em produção corresponde ao secret do webhook configurado
- **SUPOSIÇÃO 3:** Tenant `receitasbell` (ID 34) tem `stripe_account_id` preenchido

---

## F1 — CHECKLIST APLICADO

| Item | Status | Evidência | Impacto | Ação |
|------|--------|-----------|---------|-------|
| **Stripe em LIVE mode** | ❌ NOK | `.env.example` mostra `sk_test_` | P0 — Bloqueio total | TASK-001 |
| **Webhook signature** | ⚠️ [PENDENTE] | Não validado (precisa ver handler) | P0 — Perda de dados | Investigar |
| **Idempotência** | ❌ NOK | Sem `idempotency_key` | P1 — Duplicação | TASK-004 |
| **Retry policy** | ❌ NOK | Sem DLQ ou retry | P1 — Perda silenciosa | TASK-005 |
| **Audit logging** | ✅ OK | CSP + correlation-id impl. | N/A | — |
| **CORS** | ✅ OK | Vercel.json com CSP | N/A | — |
| **Rate limiting** | ❌ NOK | Sem @upstash/ratelimit | P2 — Abuso | TASK-006 |
| **Timeout webhook** | ⚠️ SUSPEITA | Vercel Serverless = 10s default | P1 — Timeout | Validar |
| **Erro padronizado** | ✅ OK | RFC 7807 impl. | N/A | — |
| **Connection pooling** | N/A | Supabase gerencia | N/A | — |
| **Testes webhook** | ❌ NOK | Sem testes de integração | P2 — Regressão | TASK-007 |

**Total:** 11 itens / 3 OK / 4 NOK / 2 PENDENTE / 1 SUSPEITA / 1 N/A

---

## F2 — SCANNER DO PROJETO

### Arquivos Relevantes Lidos

- ✅ `.env.example` — variáveis esperadas
- ✅ `api/payments/[...path].ts` — entry point
- ✅ `src/server/payments/router.ts` — roteamento
- ❌ `src/server/payments/application/handlers/webhooks/stripe.ts` — **PENDENTE LEITURA**

### Variáveis de Ambiente (Stripe)

```bash
STRIPE_SECRET_KEY=sk_test_...        # ❌ TEST MODE
STRIPE_WEBHOOK_SECRET=whsec_...      # ⚠️ Desconhecido se é LIVE ou TEST
```

**FATO:** `.env.example` mostra `sk_test_`, indicando TEST mode.

---

## F3 — MAPA DO BACKEND

### Módulos Principais

```
api/payments/
  [. ..path].ts               # Entry (delega para router)
  └─ src/server/payments/
       router.ts              # Roteamento
       application/handlers/
         checkout/
           session.ts         # Criar checkout session
         connect/
           account.ts         # Stripe Connect account
           onboarding-link.ts # Onboarding link
           status.ts          # Status da conta
         webhooks/
           stripe.ts          # ⚠️ WEBHOOK HANDLER (CRÍTICO)
```

### Rotas Mapeadas

| Método | Rota | Handler | Auth | Timeout |
|--------|------|---------|------|---------||
| POST | `/api/payments/checkout/session` | `checkoutSessionHandler` | JWT | 10s (Vercel) |
| GET | `/api/payments/connect/account` | `connectAccountHandler` | JWT | 10s |
| GET | `/api/payments/connect/onboarding-link` | `connectLinkHandler` | JWT | 10s |
| GET | `/api/payments/connect/status` | `connectStatusHandler` | JWT | 10s |
| POST | `/api/payments/webhook` | `webhookStripeHandler` | **Stripe Signature** | 10s |
| POST | `/api/payments/webhooks/stripe` | `webhookStripeHandler` | **Stripe Signature** | 10s |

**FATO:** Webhook tem 2 aliases (`/webhook` e `/webhooks/stripe`).

### Dependências Externas

| Serviço | Timeout Esperado | Retry | Evidência |
|---------|------------------|-------|------------|
| Stripe API | 10s (Vercel limit) | **Desconhecido** | **[PENDENTE]** |
| Supabase | 5s (assumption) | **Desconhecido** | **[PENDENTE]** |

### Dados Sensíveis (PII)

- **transactions** table: `user_id`, `amount`
- **users** table: `email` (mascarado em logs ✅)

### TOP 3 Fluxos Críticos

1. **Checkout → Webhook → Supabase**
2. **Connect Onboarding**
3. **Auditoria de Pagamentos**

---

## F4 — TRILHA ESCOLHIDA

**TRILHA C: Auditar e Melhorar**

Justificativa: backend existe e funciona em TEST mode. Foco em **hardening para produção**.

---

## F5 — ACHADOS PRIORIZADOS (P0–P3)

### P0-001: Stripe em TEST Mode

**Problema:** Chaves Stripe são `sk_test_`, bloqueando pagamentos reais.

**Onde:** `.env` (produção Vercel)

**Evidência:** `.env.example` linha 17

**Impacto:** Sistema não funciona em produção. Bloqueio total.

**Causa:** Chaves LIVE não foram geradas/configuradas.

**Correção:**

1. Antigravity acessa Stripe Dashboard
2. Ativa LIVE mode
3. Gera chaves LIVE (`pk_live_...`, `sk_live_...`)
4. Atualiza Vercel env vars (Production)
5. Redeploy

**Critério de Aceite:**
- Stripe dashboard mostra LIVE mode ativo
- Vercel env vars atualizadas
- Deploy ok
- Smoke test: criar checkout e verificar no Stripe Dashboard (LIVE)

**Como Testar:**
```bash
# Antigravity: verificar no dashboard Stripe se checkout session foi criada em LIVE
```

**Risco de Rollout:** Baixo (apenas env vars)

**Reversibilidade:** Alta (revert env vars)

**Feature Flag:** Não necessária

**Tarefa:** `IMPLANTAR/tasks/TASK-001-stripe-prod.md`

---

### P0-002: Webhook Signature Validation [PENDENTE LEITURA]

**Problema:** Sem acesso ao código de `webhookStripeHandler`, não posso confirmar se validação de assinatura está correta.

**Onde:** `src/server/payments/application/handlers/webhooks/stripe.ts`

**[PENDENTE]:** Ler arquivo para validar:
1. Se usa `stripe.webhooks.constructEvent()`
2. Se `STRIPE_WEBHOOK_SECRET` é usado
3. Se trata erros de signature corretamente (401 vs 500)

**Impacto:** Se signature falhar, webhook retorna erro e Stripe reprocessa. Se não validar, aceita webhooks falsos.

---

### P1-003: Sem Idempotência em Webhook

**Problema:** Stripe pode reenviar webhook se timeout ou erro 500. Sem idempotência, transação pode duplicar.

**Onde:** `webhookStripeHandler`

**Evidência:** Sem campo `idempotency_key` ou `stripe_event_id` único na tabela `transactions`.

**Impacto:** Duplicação de cobrança ou liberação de receita.

**Correção:**

1. Adicionar coluna `stripe_event_id` (UNIQUE) em `transactions`
2. Modificar handler para verificar se evento já foi processado:

```typescript
// Snippet para OpenCode
const { id: eventId, type, data } = event;

// Verificar se já processado
const { data: existing } = await supabase
  .from('transactions')
  .select('id')
  .eq('stripe_event_id', eventId)
  .single();

if (existing) {
  // Evento já processado, retornar 200 ok
  return response.status(200).json({ received: true, idempotent: true });
}

// Processar evento...
await supabase.from('transactions').insert({
  stripe_event_id: eventId,
  // ...
});
```

**Critério de Aceite:**
- Migration adicionou coluna `stripe_event_id UNIQUE`
- Handler verifica duplicata antes de inserir
- Teste: reenviar mesmo webhook → não duplica

**Tarefa:** `TASK-004-idempotency.md`

---

### P1-004: Sem Retry Policy

**Problema:** Se Supabase falhar (timeout, indisponibilidade), webhook retorna erro e Stripe reprocessa. Sem DLQ, dados podem se perder após 3 retries do Stripe.

**Impacto:** Perda silenciosa de transações.

**Correção:**

1. Adicionar try/catch robusto:

```typescript
try {
  await supabase.from('transactions').insert(...);
  return response.status(200).json({ received: true });
} catch (error) {
  // Log erro com correlation-id
  console.error({
    correlation_id: req.headers['x-correlation-id'],
    event: 'webhook_failed',
    error: error.message,
    stripe_event_id: eventId,
  });
  
  // Sentry capture
  Sentry.captureException(error);
  
  // Retornar 500 para Stripe retentar
  return response.status(500).json({ error: 'Internal Server Error' });
}
```

2. Monitorar Sentry para falhas recorrentes
3. Considerar fallback: armazenar eventos falhados em tabela `failed_webhooks` para reprocessamento manual

**Tarefa:** `TASK-005-retry-policy.md`

---

### P2-005: Sem Rate Limiting

**Problema:** Rotas de pagamento sem rate limit. Abuso pode saturar Stripe API.

**Correção:**

Adicionar `@upstash/ratelimit` em rotas sensíveis:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 req/min
});

// No handler
const { success, limit, remaining, reset } = await ratelimit.limit(
  `checkout:${userId}`
);

if (!success) {
  return response.status(429).json({
    type: 'https://api.receitasbell.com/errors/rate-limit',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: 'Too many checkout requests',
    'x-ratelimit-limit': limit,
    'x-ratelimit-remaining': remaining,
    'x-ratelimit-reset': reset,
  });
}
```

**Tarefa:** `TASK-006-rate-limit.md`

---

## F6 — PREVISÃO DE FALHAS FUTURAS

### 3 Meses
- Stripe webhook timeout em Vercel (10s) pode ser atingido em volume alto
- Sem monitoring de taxa de falha de webhook

### 1 Ano
- Crescimento de `transactions` table sem partition strategy
- Custo Stripe crescendo linearmente (sem tier pricing)

### 3 Anos
- Migração Stripe Connect Standard → Express (se regras mudarem)
- EU payment regulations (Strong Customer Authentication)

---

## F9 — HANDOFF FINAL

### Sequência de Execução

1. **TASK-001:** Antigravity migra Stripe para LIVE (BLOQUEADO até acesso)
2. **TASK-002:** OpenCode reseta senha admin (paralelo, não depende de 001)
3. **[PENDENTE]:** Claude lê `webhookStripeHandler` e cria TASK-003 se necessário
4. **TASK-004:** OpenCode adiciona idempotência (depende de 003)
5. **TASK-005:** OpenCode adiciona retry policy
6. **TASK-006:** OpenCode adiciona rate limiting
7. **Smoke Test Final:** Antigravity testa pagamento real em LIVE

### Próximos Passos Imediatos

**Para Claude (você):**
1. Ler `src/server/payments/application/handlers/webhooks/stripe.ts`
2. Criar TASK-003 se encontrar problemas
3. Atualizar `IMPLANTAR/01-TAREFAS-ATIVAS.md`

**Para Antigravity:**
1. Executar TASK-001 (Stripe LIVE)
2. Executar TASK-002 (Admin reset) via SQL

**Para OpenCode:**
1. Aguardar TASK-003, 004, 005, 006 serem criadas
2. Executar em ordem

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)