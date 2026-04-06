# Receitas Bell Backend - Guia Prático de Correções

**Objetivo:** Arrumar o que já existe para fazer funcionar em produção.

---

## ⚡ Ações Imediatas (Execute Agora)

### 1. Validar Multi-Tenancy (URGENTE)
```bash
# Testar isolamento de dados entre tenants
curl -H "x-tenant-slug: tenant1" http://localhost:3000/api/public/recipes
curl -H "x-tenant-slug: tenant2" http://localhost:3000/api/public/recipes

# Validar RLS policies no Supabase
# Ir para: Supabase Dashboard > Database > Policies
# Verificar policies ativas em todas as tabelas
```
**Risco se não validar:** Vazamento de dados entre tenants.

### 2. Adicionar Timeouts em Todas as Dependências
```typescript
// src/server/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
      },
    },
  }
);
```

```typescript
// src/server/integrations/stripe/client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  timeout: 10000, // 10s timeout
  maxNetworkRetries: 2,
});
```

### 3. Validar Rate Limiting
```typescript
// Verificar se Upstash está configurado corretamente
// Arquivo esperado: src/server/shared/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
  analytics: true,
});

// Usar em rotas:
export async function withRateLimit(request: Request, identifier: string) {
  const { success, reset } = await rateLimiter.limit(identifier);
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        type: 'https://api.receitasbell.com/errors/rate-limit',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: 'Too many requests. Please try again later.',
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  return null; // Continue
}
```

### 4. Adicionar SLI/SLO Básicos
```typescript
// src/server/shared/monitoring.ts
export const SLO = {
  availability: 0.999, // 99.9%
  latencyP95: 300, // 300ms
  errorRate: 0.01, // 1%
} as const;

// Logar métricas em cada request
export function logMetrics({
  method,
  path,
  status,
  duration,
  correlationId,
}: {
  method: string;
  path: string;
  status: number;
  duration: number;
  correlationId: string;
}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'http_request',
      method,
      path,
      status,
      duration_ms: duration,
      correlation_id: correlationId,
      is_error: status >= 400,
      is_slow: duration > SLO.latencyP95,
    })
  );
}
```

### 5. Configurar Connection Pooling do Supabase
```typescript
// Usar Supabase Pooler (transaction mode)
// Atualizar SUPABASE_URL para usar pooler:
// De: https://xxx.supabase.co
// Para: https://xxx.pooler.supabase.com (transaction mode)

// .env.production
SUPABASE_URL=https://your-project.pooler.supabase.com
```

### 6. Implementar Cursor Pagination
```typescript
// Exemplo: src/server/repositories/recipes.ts
export async function listRecipes({
  tenantId,
  cursor,
  limit = 25,
}: {
  tenantId: string;
  cursor?: string;
  limit?: number;
}) {
  const query = supabase
    .from('recipes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor) {
    query.gt('id', cursor); // WHERE id > cursor
  }

  const { data, error } = await query;

  if (error) throw error;

  const hasMore = data.length === limit;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    data,
    pagination: {
      cursor: nextCursor,
      has_more: hasMore,
      limit,
    },
  };
}
```

### 7. Gerar SBOM no CI
```yaml
# .github/workflows/security.yml (adicionar step)
- name: Generate SBOM
  run: |
    npx @cyclonedx/cyclonedx-npm --output-file sbom.json
    
- name: Upload SBOM
  uses: actions/upload-artifact@v4
  with:
    name: sbom
    path: sbom.json
```

---

## 🔧 Correções de Segurança

### Fixar GitHub Actions por SHA
```yaml
# .github/workflows/*.yml
# EM VEZ DE:
- uses: actions/checkout@v4

# USAR:
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

### Adicionar ESLint Rule no-console
```js
// eslint.config.js
export default [
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
```

---

## 📊 Observabilidade Mínima

### Estrutura de Log Obrigatória
```typescript
// Todos os logs devem ter:
interface LogEntry {
  timestamp: string; // ISO 8601 UTC
  level: 'info' | 'warn' | 'error';
  correlation_id: string; // UUID v4
  event: string; // http_request, db_query, stripe_call, etc
  [key: string]: unknown; // Dados específicos
}
```

### Configurar Alertas no Sentry (Mínimo)
```typescript
// src/server/shared/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% das requisições
  
  beforeSend(event, hint) {
    // Remover PII dos logs
    if (event.request?.data) {
      delete event.request.data.cpf;
      delete event.request.data.password;
      delete event.request.data.credit_card;
    }
    return event;
  },
});
```

---

## ✅ Checklist de Validação

Antes de fazer deploy:

```bash
# 1. Lint e Typecheck
npm run lint
npm run typecheck

# 2. Testes
npm run test:unit

# 3. Build
npm run build

# 4. Secret Scan
npx trufflehog filesystem . --fail

# 5. Dependency Scan
npm audit --audit-level=high

# 6. Smoke Test
curl http://localhost:3000/api/health
```

---

## 🚀 Deploy Seguro

### Canary Deploy (Recomendado)
```bash
# 1. Deploy para 1% do tráfego
vercel deploy --prod --target=preview

# 2. Monitorar por 30min
# - Error rate < 1%
# - Latency p95 < 300ms
# - No critical errors no Sentry

# 3. Se OK, promover para 100%
vercel promote <deployment-url>

# 4. Se NOK, rollback
vercel rollback
```

### Rollback em 1 Comando
```bash
# Reverte para último deploy estável
vercel rollback
```

---

## 📝 Variáveis de Ambiente Obrigatórias

Verificar se TODAS estão configuradas na Vercel:

```bash
# Base
NODE_ENV=production
APP_BASE_URL=https://receitasbell.com
ADMIN_API_SECRET=<32+ chars>
APP_COOKIE_SECRET=<32+ chars>
ENCRYPTION_KEY=<base64 32 bytes>

# Supabase (com pooler)
SUPABASE_URL=https://xxx.pooler.supabase.com
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=<token>

# Sentry
SENTRY_DSN=https://...

# Cron
CRON_SECRET=<16+ chars>
```

---

## ⚠️ O Que NÃO Fazer

- ❌ Não usar `console.log` em produção
- ❌ Não fazer `SELECT *` em queries
- ❌ Não fazer chamadas externas sem timeout
- ❌ Não fazer retry sem backoff
- ❌ Não committar secrets
- ❌ Não logar PII (CPF, senha, cartão)
- ❌ Não fazer deploy sem validar healthcheck

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
