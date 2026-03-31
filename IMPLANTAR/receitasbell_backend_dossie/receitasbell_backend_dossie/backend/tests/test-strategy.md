# Estratégia de Testes

## Camadas
- Unit: helpers, auth, normalization, repos puros
- Integration: login, health, catálogo, settings admin, webhook
- Smoke: health endpoints e rota principal
- Operacional: flows Playwright existentes
- Segurança: secret scan + SAST + audit

## Prioridade imediata
1. `withApiHandler`
2. login-password
3. health endpoints
4. webhook Stripe
