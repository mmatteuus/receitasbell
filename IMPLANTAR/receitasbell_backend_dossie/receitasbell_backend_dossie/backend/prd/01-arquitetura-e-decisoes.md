# 01 — Arquitetura e Decisões

## Arquitetura alvo sem quebra

### Estrutura
```text
api/ e api_handlers/  -> borda HTTP
src/server/shared/    -> http, env, logger, errors, segurança
src/server/auth/      -> sessões, login, social auth, guards
src/server/tenancy/   -> resolução de tenant
src/server/payments/  -> providers, handlers, repo, webhooks
src/server/integrations/ -> Supabase, Baserow, Redis, email
```

## Decisões principais

### DEC-001 — Manter Vercel como gateway atual
**FATO**
- Projeto já roda em Vercel com headers de segurança e rewrites.

**Decisão**
- Não introduzir gateway adicional agora.
- Centralizar hardening em `vercel.json` e helpers HTTP.

### DEC-002 — Padronizar todos os handlers em `withApiHandler`
**FATO**
- A assinatura nova do helper já existe.
- Os handlers estão inconsistentes.

**Decisão**
- Migrar tudo para HOF única:
```ts
export default withApiHandler(async (req, res, ctx) => {
  // ...
});
```

### DEC-003 — Sessão com enum de role estrito
**Decisão**
- `role` aceito: `user`, `admin`, `owner`.
- Qualquer outro valor vira `user`.

### DEC-004 — Contrato HTTP evolutivo e não destrutivo
**Decisão**
- Manter respostas existentes onde necessário.
- Introduzir padrão compatível para erros e paginação de forma aditiva.
- Evitar breaking change em rotas atuais sem feature flag.

### DEC-005 — Webhook Stripe com idempotência obrigatória
**Decisão**
- Persistir `event.id`.
- Bloquear reprocessamento de side effects.
- Substituir `console.*` por logger estruturado.

### DEC-006 — Provider de pagamento precisa ficar explícito por domínio
**Decisão**
- Documentar provider primário e legado.
- Proibir lógica implícita espalhada em README/env/código.

## Contratos técnicos

### Erro padrão
Fase 1: manter shape legado.
Fase 2: adicionar RFC 7807 sem remover campos existentes.

### Paginação
Adicionar cursor-based de forma opcional:
```json
{
  "items": [],
  "meta": {
    "nextCursor": "opaque",
    "limit": 25
  },
  "requestId": "..."
}
```

### Rate limit
- Token bucket
- Upstash Redis
- Headers obrigatórios:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After`

### Timeouts base
| Dependência | Timeout | Retry |
|---|---:|---:|
| Supabase | 5s | 1x leitura segura |
| Stripe | 10s | 2x com jitter |
| Baserow | 8s | 2x com jitter |
| Redis | 500ms | 1x |
| Resend | 8s | 2x com jitter |

## Protocolo de não-quebra aplicado
- mudanças aditivas primeiro
- feature flag para mudança de comportamento
- rollback em 1 comando
- canário em auth/pagamento
- baseline de testes antes e depois



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

