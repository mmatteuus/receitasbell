# Performance baseline

## Rotas
- `POST /api/payments/checkout/session`
- `POST /api/payments/webhooks/stripe`
- `GET /api/payments/connect/status`

## Alvos iniciais
- checkout p95 < 300ms sem rede real
- webhook p95 < 150ms para dedupe + update local
- connect status p95 < 100ms

## Gargalos a observar
- latência do Baserow
- retries excessivos
- JSON payloads grandes em eventos
