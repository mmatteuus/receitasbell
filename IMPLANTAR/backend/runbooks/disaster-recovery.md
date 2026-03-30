# Disaster recovery

## Backup mínimo antes do corte
- `Payment_Orders`
- `payment_events`
- `Entitlements`
- tabelas de conexão legadas e Stripe

## RTO/RPO sugeridos
- RTO: 30 min
- RPO: 5 min para dados transacionais

## Plano
1. snapshot/export antes da mudança
2. tag git `pre-stripe-only-cutover`
3. smoke tests pós-restore
4. restore somente se houver perda de integridade operacional
