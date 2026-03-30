# Checklist de concluído

- [ ] todo código novo de pagamentos está em `src/server/payments/**`
- [ ] Stripe é o único provider de novos pedidos
- [ ] Mercado Pago não aparece em runtime, env, docs operacionais ou UI final
- [ ] `vercel.json` está limpo
- [ ] cron legado removido
- [ ] webhook Stripe confirma pedidos
- [ ] entitlement é criado uma única vez
- [ ] logs e métricas incluem `provider=stripe`
- [ ] `npm run gate` verde
- [ ] rollback documentado e testado
