# Dossiê Completo Parte 2 - Erros P1, P2, P3 + Plano de Execução

**Continuação de:** DOSSIE-COMPLETO-PARTE1.md  
**Desenvolvido por:** MtsFerreira | [mtsferreira.dev](https://mtsferreira.dev)

---

## 🟠 ERROS ALTOS (P1) - CONTINUAÇÃO

### P1-5: Idempotência Ausente
**Erro:** Nenhuma proteção contra requisições duplicadas  
**Risco:** Cobranças duplicadas, dados inconsistentes  
**Agente:** Resiliência

```typescript
// src/server/shared/idempotency.ts
import { redis } from '@/server/integrations/upstash/client';

const IDEMPOTENCY_TTL = 86400; // 24 horas

export async function withIdempotency(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const key = request.headers.get('idempotency-key');
  if (!key) {
    // Idempotency-Key opcional para GET, obrigatório para POST/PUT/DELETE
    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({
          type: 'https://api.receitasbell.com/errors/missing-idempotency-key',
          title: 'Missing Idempotency Key',
          status: 400,
          detail: 'Header Idempotency-Key is required for this operation',
        }),
        { status: 400 }
      );
    }
    return handler();
  }

  // Verificar se já foi processado
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) {
    const response = JSON.parse(cached as string);
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }

  // Processar
  const response = await handler();
  const body = await response.text();

  // Cachear resultado
  await redis.setex(
    `idempotency:${key}`,
    IDEMPOTENCY_TTL,
    JSON.stringify({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    })
  );

  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}
```

---

### P1-6: Graceful Shutdown Ausente
**Erro:** Sem handler de SIGTERM  
**Risco:** Requests cortados em deploy  
**Agente:** Resiliência

Vercel Serverless **não precisa** de graceful shutdown (stateless). Marcar como N/A.

---

### P1-7: Health Check Incompleto
**Erro:** /api/health não valida dependências  
**Risco:** Deploy com serviços quebrados  
**Agente:** Observabilidade

```typescript
// api/health/live.ts
export async function GET() {
  // Liveness: processo vivo?
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}

// api/health/ready.ts
import { supabase } from '@/server/integrations/supabase/client';
import { redis } from '@/server/integrations/upstash/client';

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  return Response.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from('_health').select('1').limit(1);
    return { status: error ? 'error' : 'ok', latency_ms: 0 };
  } catch (e) {
    return { status: 'error', error: String(e) };
  }
}

async function checkCache() {
  try {
    await redis.ping();
    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', error: String(e) };
  }
}
```

---

### P1-8: CORS Não Validado
**Erro:** Configuração de CORS desconhecida  
**Risco:** CSRF, requisições não autorizadas  
**Agente:** Segurança

```typescript
// src/server/shared/cors.ts
const ALLOWED_ORIGINS = [
  'https://receitasbell.com',
  'https://www.receitasbell.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

export function getCorsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {}; // Sem CORS para origins não permitidas
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    'Access-Control-Max-Age': '86400',
  };
}
```

---

### P1-9: Logs com console.log
**Erro:** Provável uso de console.log em produção  
**Risco:** Logs não estruturados, PII vazado  
**Agente:** Observabilidade

```typescript
// src/server/shared/logger.ts
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  correlation_id: string;
  event: string;
  [key: string]: unknown;
}

export const logger = {
  info(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    console.log(JSON.stringify({ ...entry, timestamp: new Date().toISOString(), level: 'info' }));
  },
  warn(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    console.warn(JSON.stringify({ ...entry, timestamp: new Date().toISOString(), level: 'warn' }));
  },
  error(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    console.error(JSON.stringify({ ...entry, timestamp: new Date().toISOString(), level: 'error' }));
  },
};

// ESLint rule
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

### P1-10: Migrations Sem Rollback
**Erro:** Processo de migration não validado  
**Risco:** Schema drift, rollback impossível  
**Agente:** Banco de Dados

```bash
# Validar processo Supabase
supabase migration list
supabase migration up
supabase migration down # Testar rollback

# Toda migration DEVE ter rollback testável
```

---

### P1-11: Deploy Não Documentado
**Erro:** Runbook de deploy ausente  
**Risco:** Deploy manual, erro humano  
**Agente:** Runbooks

```markdown
# backend/runbooks/deploy-e-rollback.md

## Deploy Canary

1. Deploy para preview:
   vercel deploy

2. Smoke test:
   curl https://preview-url.vercel.app/api/health/ready

3. Monitorar 30min:
   - Error rate < 1%
   - Latency p95 < 300ms
   - Zero critical errors no Sentry

4. Promover para prod:
   vercel promote <url>

## Rollback

1. Comando imediato:
   vercel rollback

2. Validar:
   curl https://receitasbell.com/api/health/ready
```

---

### P1-12: Secret Scanning Não em Cada PR
**Erro:** Secret scan só em workflow separado  
**Risco:** Secrets commitados  
**Agente:** Segurança

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: pull_request

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
        with:
          fetch-depth: 0
          
      - name: Secret Scan
        run: |
          docker run -v "$PWD:/path" ghcr.io/trufflesecurity/trufflehog:latest \
            git file:///path --since-commit HEAD~1 --fail
```

---

## 🟡 ERROS MÉDIOS (P2) - 30 DIAS

### P2-1: Coverage Desconhecido
```bash
npm run test:unit -- --coverage
# Target: > 80% em src/server
```

### P2-2: pg_stat_statements Não Validado
```sql
-- Supabase SQL Editor
SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';
-- Deve retornar 1 linha
```

### P2-3: Índices Não Justificados
```sql
-- Auditar índices
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### P2-4: Versionamento de API Ausente
```typescript
// Implementar versionamento via URL
// /api/v1/recipes
// Sunset Header para deprecated:
res.headers.set('Sunset', 'Sat, 01 Mar 2026 00:00:00 GMT');
res.headers.set('Deprecation', 'true');
```

### P2-5 a P2-15: [Ver arquivo P2-DETALHADO.md]

---

## 🔵 ERROS BAIXOS (P3) - BACKLOG

### P3-1: Dead Code
```bash
npm install -D eslint-plugin-unused-imports
# Adicionar ao eslint.config.js
```

### P3-2: Dependências Desatualizadas
```bash
npm outdated
npm update
```

### P3-3 a P3-8: [Ver arquivo P3-MELHORIAS.md]

---

## 📅 PLANO DE EXECUÇÃO POR AGENTE

### AGENTE SEGURANÇA (Dias 1-3)

**Dia 1:**
- [ ] P0-1: Validar RLS no Supabase (2h)
- [ ] P0-3: Implementar rate limiting (3h)
- [ ] P0-5: Gerar SBOM no CI (1h)
- [ ] P0-7: Auditar validação de input (2h)

**Dia 2:**
- [ ] P1-3: Fixar GitHub Actions por SHA (2h)
- [ ] P1-8: Validar CORS (1h)
- [ ] P1-12: Secret scan em PR (1h)

**Dia 3:**
- [ ] Teste de segurança completo
- [ ] Relatório de pendências

**Entregável:** Relatório de segurança + código commitado

---

### AGENTE RESILIÊNCIA (Dias 1-4)

**Dia 1:**
- [ ] P0-2: Adicionar timeouts (3h)
- [ ] P0-6: Configurar connection pooling (2h)
- [ ] P1-2: Implementar retry com backoff (2h)

**Dia 2:**
- [ ] P1-1: Cursor pagination (4h)
- [ ] P1-5: Idempotência (3h)

**Dia 3-4:**
- [ ] Teste de carga (ab, k6)
- [ ] Validar timeouts em falha
- [ ] Documentar configurações

**Entregável:** Código + testes de carga passando

---

### AGENTE OBSERVABILIDADE (Dias 2-5)

**Dia 2:**
- [ ] P0-4: Definir SLI/SLO (2h)
- [ ] P0-8: Configurar alertas Sentry (3h)

**Dia 3:**
- [ ] P1-7: Health check completo (2h)
- [ ] P1-9: Logger estruturado (2h)

**Dia 4-5:**
- [ ] Dashboard no Sentry
- [ ] Validar alertas
- [ ] Documentar runbook de incidente

**Entregável:** SLO doc + alertas ativos + dashboard

---

### AGENTE CONTRATOS (Dias 3-6)

**Dia 3-5:**
- [ ] P1-4: OpenAPI 3.1 completo (8h)

**Dia 6:**
- [ ] Testes de contrato (Spectral)
- [ ] Validação de aderência

**Entregável:** openapi.yaml completo + testes passando

---

### AGENTE COMPLIANCE (Dias 4-7)

**Dia 4-5:**
- [ ] Mapear PII no banco (4h)
- [ ] Documentar base legal LGPD (3h)

**Dia 6:**
- [ ] Política de retenção (2h)
- [ ] Script de right-to-deletion (3h)

**Dia 7:**
- [ ] Audit log schema (2h)
- [ ] Checklist LGPD/GDPR

**Entregável:** /backend/compliance/* completo

---

### AGENTE RUNBOOKS (Dias 5-7)

**Dia 5-6:**
- [ ] P1-11: Deploy + rollback (3h)
- [ ] Runbook de incidente (2h)
- [ ] Disaster recovery (2h)

**Dia 7:**
- [ ] Capacity planning (2h)
- [ ] Postmortem template (1h)

**Entregável:** /backend/runbooks/* completo

---

### AGENTE BANCO DE DADOS (Dias 6-8)

**Dia 6:**
- [ ] P1-10: Validar migrations (2h)
- [ ] P2-2: Validar pg_stat_statements (1h)

**Dia 7:**
- [ ] P2-3: Auditar índices (4h)

**Dia 8:**
- [ ] Documentar schema (2h)
- [ ] Migration linting (1h)

**Entregável:** Relatório de DB + migrations validadas

---

### AGENTE EXECUTOR (Dias 8-14)

**Implementa EXATAMENTE o código produzido pelos agentes acima.**

**Dia 8-10:** P0 (crítico)  
**Dia 11-12:** P1 (alto)  
**Dia 13-14:** P2 selecionados + testes finais

**Entregável:** Código deployado + testes passando

---

## ✅ CRITÉRIOS DE SUCESSO GLOBAIS

### Deploy em Produção Só Acontece Se:

```bash
# 1. Gate passa
npm run gate
# Lint OK + Typecheck OK + Build OK + Tests OK

# 2. Security scans limpos
npx trufflehog filesystem . --fail
npm audit --audit-level=high

# 3. Health check OK
curl http://localhost:3000/api/health/ready | jq '.status'
# "ok"

# 4. Smoke test OK
curl http://localhost:3000/api/public/recipes | jq '.data | length'
# > 0

# 5. SBOM gerado
ls sbom.json

# 6. Todos os P0 resolvidos
# Checklist manual
```

---

## 📊 PROGRESSO ESPERADO

| Semana | P0 | P1 | P2 | P3 | Deploy |
|--------|----|----|----|----|--------|
| 1 | 8/8 (100%) | 6/12 (50%) | 0/15 | 0/8 | Staging |
| 2 | - | 12/12 (100%) | 8/15 (53%) | 2/8 | Canary 10% |
| 3 | - | - | 15/15 (100%) | 5/8 | Prod 100% |
| 4 | - | - | - | 8/8 | Hardening |

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
