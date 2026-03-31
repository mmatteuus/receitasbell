# 01 — Achados Priorizados

## P0

### P0-001 — Credencial sensível exposta
**Problema**  
Arquivo de service account com `private_key` exposto.

**Impacto**  
Comprometimento crítico de credenciais.

**Correção**
1. Rotacionar chave.
2. Remover do repositório e histórico.
3. Adicionar secret scan no CI.
4. Auditar uso da credencial.

**Teste**
- chave antiga inválida
- arquivo ausente no branch principal
- scan sem findings

**Risco de rollout**  
Baixo para código, alto para operação se a rotação não for coordenada.

---

### P0-002 — Build quebrado por uso errado de `withApiHandler`
**Problema**  
Handlers usam a assinatura antiga.

**Impacto**  
`typecheck` falha e produção não deploya.

**Correção**
1. Encontrar todos os usos antigos.
2. Migrar para a HOF nova.
3. Rodar `npm run gate`.

**Teste**
```bash
grep -R "withApiHandler(request, response" -n api api_handlers src && exit 1 || echo CLEAN
npm run gate
```

**Risco de rollout**  
Médio-alto, porque toca muitos handlers.

---

### P0-003 — Role inválida no fluxo de login
**Problema**  
`member` ou string arbitrária entra em `createSession`.

**Impacto**  
Typecheck quebrado e risco de authZ inconsistente.

**Correção**
- Normalizar role em helper.
- Aplicar nos fluxos de sessão.

## P1

### P1-001 — Drift entre README, envs e runtime
**Problema**  
Docs e envs não refletem runtime real.

**Impacto**  
Onboarding e deploy inconsistentes.

### P1-002 — CI sem secret scan/SAST/SBOM
**Problema**  
Segurança não bloqueia merge/deploy.

**Impacto**  
Risco de segredo/vulnerabilidade seguir para produção.

### P1-003 — Webhook Stripe sem idempotência explícita
**Problema**  
Sem deduplicação robusta por `event.id`.

**Impacto**  
Possível dupla concessão de entitlement.

### P1-004 — Logs de produção inconsistentes
**Problema**  
Mistura de `Logger` e `console.*`.

**Impacto**  
Baixa capacidade de investigação.

## P2

### P2-001 — CSP ainda em report-only
### P2-002 — Paginação ainda não formalizada
### P2-003 — Falta de artefatos de compliance
### P2-004 — Falta de runbooks formais

## P3

### P3-001 — README e naming precisam consolidação
### P3-002 — Estratégia de versionamento ainda implícita



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

