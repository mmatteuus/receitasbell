# Deploy e Rollback

## Deploy
1. Confirmar `npm run gate`.
2. Subir preview deploy.
3. Validar smoke.
4. Liberar canário:
   - 1%
   - 5%
   - 10%
   - 25%
   - 50%
   - 100%

## Rollback
```bash
git revert HEAD
git push origin main
```

## Regras
- Auth e pagamento sempre com feature flag.
- Monitorar 30 min em cada etapa crítica.
