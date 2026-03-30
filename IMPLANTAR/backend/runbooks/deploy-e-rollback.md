# Deploy e rollback

## Estratégia
Sem canary percentual nativo no plano atual, usar:
1. preview deploy
2. validação manual admin-only
3. ativar flags em tenant de teste
4. ativar flags no tenant principal
5. remover legado
6. monitorar 30 minutos

## Ordem
1. deploy com código aditivo
2. ativar `FF_STRIPE_CONNECT_READY_GATE`
3. ativar `FF_PAYMENTS_STRIPE_CHECKOUT`
4. ativar `FF_PAYMENTS_STRIPE_WEBHOOK`
5. ativar `FF_PAYMENTS_PROVIDER_STRIPE_ONLY`
6. remover aliases/legado quando estável

## Rollback
```bash
git revert HEAD
git push origin main
```

## Rollback lógico
- voltar `PAYMENTS_PROVIDER_MODE` para compatibilidade temporária, se ainda existir
- desativar `FF_PAYMENTS_STRIPE_CHECKOUT`
- manter dados migrados; não reverter schema em produção sem análise
