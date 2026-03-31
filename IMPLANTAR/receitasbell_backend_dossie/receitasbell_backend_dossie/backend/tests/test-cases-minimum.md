# Casos mínimos

## Auth
- login com credenciais válidas retorna 200
- login inválido retorna 401
- role inválida é normalizada para `user`

## HTTP
- handlers usam HOF correta
- `requestId` sempre existe na resposta

## Health
- `/api/health/live` retorna 200
- `/api/health/ready` retorna 200 ou 503 coerente

## Pagamentos
- webhook duplicado não duplica entitlement
- assinatura inválida retorna 400
