# Protocolo de não-quebra aplicado

## Regras para esta mudança
- [x] mudanças aditivas primeiro
- [x] feature flag para comportamento novo
- [x] expand → migrate → contract para schema
- [x] aliases temporários para rotas antigas
- [x] rollback em 1 comando
- [x] smoke antes e depois
- [x] remover legado só após estabilidade

## Classificação
Tipo: migração de provider externo  
Risco: crítico

## Feature flags
- `FF_STRIPE_CONNECT_READY_GATE`
- `FF_PAYMENTS_STRIPE_CHECKOUT`
- `FF_PAYMENTS_STRIPE_WEBHOOK`
- `FF_PAYMENTS_PROVIDER_STRIPE_ONLY`

## Rollback
```bash
git revert HEAD
git push origin main
```
