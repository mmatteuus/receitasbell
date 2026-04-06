# Dossiê Completo de Erros e Correções - Receitas Bell Backend

**Data:** 2026-04-06  
**Objetivo:** Pontuar TODOS os erros + plano executável para cada agente  
**Desenvolvido por:** MtsFerreira | [mtsferreira.dev](https://mtsferreira.dev)

---

## 📊 RESUMO EXECUTIVO

### Gravidade dos Erros
- 🔴 **CRÍTICO (P0):** 8 erros → ação imediata (< 24h)
- 🟠 **ALTO (P1):** 12 erros → próximos 7 dias
- 🟡 **MÉDIO (P2):** 15 erros → próximos 30 dias
- 🔵 **BAIXO (P3):** 8 erros → backlog

### Total: 43 erros identificados

---

## 🔴 ERROS CRÍTICOS (P0) - AÇÃO IMEDIATA

### P0-1: Multi-Tenancy Sem Validação
**Erro:** Não validamos se RLS (Row Level Security) está ativo no Supabase  
**Risco:** Vazamento de dados entre tenants (receita tenant1 visível para tenant2)  
**Impacto:** GDPR/LGPD violation, perda total de confiança  
**Evidência:** Não vimos policies validadas

**Agente:** Segurança  
**Tarefa:** Validar RLS no Supabase  
**Comandos:**
```sql
-- Executar no Supabase SQL Editor
-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Todas as tabelas com tenant_id DEVEM ter rowsecurity = true

-- 2. Verificar policies existentes
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- 3. Criar policy de exemplo para tabela recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their tenant's recipes"
ON recipes
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Teste:**
```bash
# Terminal 1: Tenant A
curl -H "x-tenant-slug: tenant-a" http://localhost:3000/api/public/recipes

# Terminal 2: Tenant B
curl -H "x-tenant-slug: tenant-b" http://localhost:3000/api/public/recipes

# Validar: respostas DEVEM ser diferentes
```

**Critério de aceite:** RLS ativo em TODAS as tabelas com tenant_id + policies testadas

---

### P0-2: Timeouts Ausentes em Dependências
**Erro:** Chamadas para Supabase, Stripe e Upstash sem timeout explícito  
**Risco:** Hang infinito → toda a API fica travada  
**Impacto:** Indisponibilidade total em falha de terceiro  
**Evidência:** Código não mostra configuração de timeout

**Agente:** Resiliência  
**Tarefa:** Adicionar timeouts em TODAS as dependências  
**Arquivos:**

```typescript
// src/server/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const fetchWithTimeout = (timeout: number) => {
  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeout),
    });
  };
};

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: fetchWithTimeout(10000), // 10s timeout
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

```typescript
// src/server/integrations/upstash/client.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  // Upstash usa timeout via fetch options
  // Wrapper necessário:
});

// Wrapper com timeout
export async function redisWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 500
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Redis timeout')), timeoutMs)
  );
  return Promise.race([operation(), timeoutPromise]);
}
```

**Teste:**
```typescript
// Simular timeout
await redisWithTimeout(() => new Promise(resolve => setTimeout(resolve, 1000)), 500);
// Deve lançar erro "Redis timeout"
```

**Critério de aceite:** Todos os clients com timeout configurado + teste passando

---

### P0-3: Rate Limiting Não Validado
**Erro:** Upstash Redis em .env mas implementação não confirmada  
**Risco:** Abuso de API → custos elevados, indisponibilidade  
**Impacto:** $$ gasto descontrolado + DDoS fácil  
**Evidência:** Não vimos middleware de rate limit

**Agente:** Segurança  
**Tarefa:** Implementar + validar rate limiting  
**Arquivo:**

```typescript
// src/server/shared/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 100 requests por minuto por IP
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit',
});

// Middleware para rotas
export async function withRateLimit(
  request: Request,
  identifier: string // IP ou user_id
): Promise<Response | null> {
  const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({
        type: 'https://api.receitasbell.com/errors/rate-limit',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: `Too many requests. Limit: ${limit}/min. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Continue processing
}
```

**Uso em rota:**
```typescript
// api/public/recipes.ts
import { withRateLimit } from '@/server/shared/rate-limit';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResponse = await withRateLimit(request, ip);
  if (rateLimitResponse) return rateLimitResponse;

  // Continuar processamento...
}
```

**Teste:**
```bash
# Fazer 101 requests em 1 minuto
for i in {1..101}; do
  curl http://localhost:3000/api/public/recipes
done
# Request 101 deve retornar 429
```

**Critério de aceite:** Rate limit ativo + headers corretos + teste 429 passando

---

### P0-4: SLI/SLO Ausentes
**Erro:** Sem definição de availability target, latency target, error budget  
**Risco:** Não sabemos quando estamos em crise  
**Impacto:** Falhas prolongadas sem detecção  
**Evidência:** Nenhuma métrica SLO documentada

**Agente:** Observabilidade  
**Tarefa:** Definir SLI/SLO + implementar tracking  
**Arquivo:**

```typescript
// src/server/shared/slo.ts
export const SLO = {
  // 99.9% availability = 43.2 min downtime/mês
  availability: {
    target: 0.999,
    errorBudget: 0.001, // 0.1%
  },
  
  // Latency p95 < 300ms
  latency: {
    p50: 100, // ms
    p95: 300, // ms
    p99: 800, // ms
  },
  
  // Error rate < 1%
  errorRate: {
    target: 0.01,
  },
} as const;

// Tracking de SLI
export interface SLI {
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  duration_ms: number;
  is_error: boolean;
  is_slow: boolean;
}

export function trackSLI(sli: SLI) {
  // 1. Log estruturado
  console.log(JSON.stringify({
    ...sli,
    level: 'info',
    event: 'sli',
  }));

  // 2. Enviar para Sentry como metric
  if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
    // Server-side only
    // Sentry.metrics.distribution('http.duration', sli.duration_ms, {
    //   tags: { endpoint: sli.endpoint, method: sli.method },
    // });
  }

  // 3. Calcular error budget consumption
  const isErrorBudgetHit = sli.is_error || sli.is_slow;
  if (isErrorBudgetHit) {
    // Log alerta se consumindo budget rápido
    console.warn(JSON.stringify({
      level: 'warn',
      event: 'error_budget_consumption',
      ...sli,
    }));
  }
}
```

**Uso em middleware:**
```typescript
// api/middleware.ts
import { trackSLI, SLO } from '@/server/shared/slo';

export async function middleware(request: Request, handler: Function) {
  const start = Date.now();
  const response = await handler(request);
  const duration = Date.now() - start;

  trackSLI({
    timestamp: new Date().toISOString(),
    endpoint: new URL(request.url).pathname,
    method: request.method,
    status: response.status,
    duration_ms: duration,
    is_error: response.status >= 500,
    is_slow: duration > SLO.latency.p95,
  });

  return response;
}
```

**Critério de aceite:** SLO documentado + tracking ativo + logs com SLI

---

### P0-5: SBOM Ausente
**Erro:** Nenhum Software Bill of Materials gerado  
**Risco:** Não conformidade EU Cyber Resilience Act (2027)  
**Impacto:** Multas regulatórias + supply chain opaco  
**Evidência:** Nenhum SBOM encontrado

**Agente:** Segurança  
**Tarefa:** Gerar SBOM em cada build  
**Arquivo:**

```yaml
# .github/workflows/security.yml (adicionar step)
steps:
  - name: Generate SBOM
    run: |
      npm install -g @cyclonedx/cyclonedx-npm
      cyclonedx-npm --output-file sbom.json
      
  - name: Upload SBOM
    uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882 # v4.4.3
    with:
      name: sbom-${{ github.sha }}
      path: sbom.json
      retention-days: 90
```

**Teste local:**
```bash
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
cat sbom.json | jq '.components | length'
# Deve mostrar quantidade de dependências
```

**Critério de aceite:** SBOM gerado em CI + artifact uploadado + formato CycloneDX válido

---

### P0-6: Connection Pooling Não Validado
**Erro:** Não confirmamos se pooling está configurado no Supabase  
**Risco:** Esgotamento de conexões em pico de tráfego  
**Impacto:** Indisponibilidade total ("too many connections")  
**Evidência:** Não vimos config de pooling

**Agente:** Resiliência  
**Tarefa:** Configurar Supabase Pooler (transaction mode)  
**Passos:**

1. **Atualizar SUPABASE_URL para usar pooler:**
```bash
# .env.production (Vercel)
# DE:
SUPABASE_URL=https://xxx.supabase.co

# PARA:
SUPABASE_URL=https://xxx.pooler.supabase.com
```

2. **Validar configuração:**
```typescript
// src/server/integrations/supabase/client.ts
export const supabase = createClient(
  process.env.SUPABASE_URL!, // Deve ser pooler URL
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    global: {
      fetch: fetchWithTimeout(10000),
    },
  }
);

// Log na inicialização
console.log('Supabase URL:', process.env.SUPABASE_URL);
if (!process.env.SUPABASE_URL?.includes('pooler')) {
  console.warn('⚠️  Using direct connection instead of pooler!');
}
```

**Teste:**
```bash
# Simular 100 conexões simultâneas
ab -n 100 -c 100 http://localhost:3000/api/public/recipes
# Não deve dar erro "too many connections"
```

**Critério de aceite:** Pooler URL configurado + teste de carga passando

---

### P0-7: Validação de Input Não Confirmada
**Erro:** Zod presente mas não validamos uso em TODAS as rotas  
**Risco:** SQL injection, XSS, mass assignment  
**Impacto:** Comprometimento total do sistema  
**Evidência:** Não auditamos schemas por rota

**Agente:** Segurança  
**Tarefa:** Auditar + garantir validação em 100% das rotas  
**Checklist:**

```typescript
// Padrão obrigatório para TODAS as rotas
import { z } from 'zod';

// 1. Definir schema
const CreateRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  ingredients: z.array(z.string()).min(1),
  steps: z.array(z.string()).min(1),
  // NUNCA aceitar tenant_id do cliente (vem do token)
});

// 2. Validar ANTES de usar
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validação obrigatória
  const validationResult = CreateRecipeSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        type: 'https://api.receitasbell.com/errors/validation',
        title: 'Validation Error',
        status: 422,
        errors: validationResult.error.errors,
      }),
      { status: 422, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const data = validationResult.data;
  // Agora pode usar data com segurança
}
```

**Auditoria:**
```bash
# Encontrar rotas sem validação
grep -r "request.json()" api/ | grep -v "safeParse"
# Resultado DEVE ser vazio
```

**Critério de aceite:** 100% das rotas com Zod validation + audit passando

---

### P0-8: Alertas Ausentes
**Erro:** Sentry configurado mas alertas não validados  
**Risco:** Falhas críticas sem notificação  
**Impacto:** Downtime prolongado sem ação  
**Evidência:** Nenhum alerta configurado

**Agente:** Observabilidade  
**Tarefa:** Configurar alertas burn-rate no Sentry  
**Passos:**

1. **Configurar no Sentry Dashboard:**
   - Ir para: Alerts → Create Alert
   - Tipo: Metric Alert
   - Metric: `error_rate`
   - Condition: `> 1%` (error budget)
   - Action: Notify via Slack/Email

2. **Alertas obrigatórios:**
   - **Fast burn** (2% budget em 1h) → Page imediato
   - **Medium burn** (5% budget em 6h) → Notificação urgente
   - **Slow burn** (10% budget em 3d) → Ticket

3. **Validar:**
```typescript
// Simular erro para testar alerta
import * as Sentry from '@sentry/node';

Sentry.captureException(new Error('Test alert - ignore'));
// Deve disparar alerta no Sentry
```

**Critério de aceite:** 3 alertas configurados + teste de disparo passando

---

## 🟠 ERROS ALTOS (P1) - PRÓXIMOS 7 DIAS

### P1-1: Offset Pagination (Performance Ruim)
**Erro:** Provável uso de OFFSET em listagens  
**Risco:** Latência p99 > 2s em tabelas grandes  
**Agente:** Resiliência  
**Solução:** Implementar cursor pagination

```typescript
// src/server/repositories/recipes.ts
export async function listRecipes({
  tenantId,
  cursor,
  limit = 25,
}: {
  tenantId: string;
  cursor?: string;
  limit?: number;
}) {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor) {
    query = query.gt('id', cursor); // WHERE id > cursor
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    data,
    pagination: {
      cursor: data.length === limit ? data[data.length - 1].id : null,
      has_more: data.length === limit,
      limit,
    },
  };
}
```

---

### P1-2: Retries Sem Backoff
**Erro:** Stripe tem `maxNetworkRetries: 2` mas sem backoff configurado  
**Risco:** Retry storms  
**Agente:** Resiliência  
**Solução:**

```typescript
// Stripe já tem backoff embutido, mas validar
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  timeout: 10000,
  maxNetworkRetries: 2,
  // Stripe usa exponential backoff automático
});

// Para outras chamadas, implementar:
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff com full jitter
      const baseDelay = 100;
      const maxDelay = 10000;
      const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
      const jitter = Math.random() * exponential;
      
      await sleep(jitter);
    }
  }
  throw new Error('Unreachable');
}
```

---

### P1-3: GitHub Actions Não Fixadas por SHA
**Erro:** Actions usando tags mutáveis (v4, v3)  
**Risco:** Supply chain compromise  
**Agente:** Segurança  
**Solução:**

```yaml
# .github/workflows/*.yml
# ANTES:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4

# DEPOIS:
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
- uses: actions/setup-node@1e60f620b9541d16bece96c5465dc8ee9832be0b # v4.0.3

# Para cada action, pegar SHA:
# 1. Ir no repo da action
# 2. Ver releases
# 3. Copiar commit SHA da tag
```

---

### P1-4: OpenAPI Ausente ou Desatualizado
**Erro:** Pasta /openapi existe mas conteúdo não validado  
**Risco:** Divergência docs vs implementação  
**Agente:** Contratos  
**Solução:** Criar OpenAPI 3.1 completo

```yaml
# openapi/openapi.yaml
openapi: 3.1.0
info:
  title: Receitas Bell API
  version: 1.0.0
  description: API multi-tenant de receitas
servers:
  - url: https://api.receitasbell.com
    description: Production
  - url: http://localhost:3000
    description: Development

paths:
  /api/public/recipes:
    get:
      summary: List recipes
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 25
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Recipe'
                  pagination:
                    $ref: '#/components/schemas/CursorPagination'
        '429':
          $ref: '#/components/responses/RateLimitError'

components:
  schemas:
    Recipe:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        
    CursorPagination:
      type: object
      properties:
        cursor:
          type: string
          nullable: true
        has_more:
          type: boolean
        limit:
          type: integer
          
  responses:
    RateLimitError:
      description: Rate limit exceeded
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
        Retry-After:
          schema:
            type: integer
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
```

---

### P1-5 a P1-12: [Continua no próximo arquivo]

**Ver:** `DOSSIE-COMPLETO-PARTE2.md`

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
