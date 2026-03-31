# Troubleshooting

## Build falha
- Rode `npm run typecheck`
- Procure usos antigos de `withApiHandler`
- Verifique role inválida em sessão

## Auth falha
- Verifique envs do Supabase
- Verifique `profiles.organization_id` e `profiles.role`

## Webhook falha
- Verifique `STRIPE_WEBHOOK_SECRET`
- Verifique assinatura e event idempotency table

## Ready falha
- Verifique dependências externas
- Verifique envs críticas
