# Execução final

1. Criar a pasta canônica `src/server/payments/**`
2. Criar `api/payments/[...path].ts`
3. Expandir `Payment_Orders` e `payment_events` para provider-agnostic
4. Criar `stripe_connect_accounts`
5. Implementar connect admin-only
6. Implementar sync de catálogo local → Stripe
7. Implementar checkout Stripe
8. Implementar webhook Stripe
9. Desligar cron reconcile legado
10. Remover Mercado Pago do `vercel.json`
11. Remover adapters, envs e serviços Mercado Pago
12. Reescrever testes e runbooks
13. Rodar validação final e smoke

## Comandos finais
```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run gate
rg -n "mercadopago|mercado_pago|mp_" .
```
