# Estratégia de testes

## Camadas
- unit: services, mappers, status transitions, idempotência
- integration: handlers + repo + mocks Stripe/Baserow
- contract: OpenAPI e Problem Details
- smoke: health, connect status, checkout create
- security: secret scan e dependency scan
- performance: benchmark básico em rotas críticas

## Testes obrigatórios
- connect account create/reuse
- connect readiness gate
- product/price sync
- checkout session create
- webhook signature validation
- webhook dedupe
- entitlement single-grant
- manual reconcile/repair
