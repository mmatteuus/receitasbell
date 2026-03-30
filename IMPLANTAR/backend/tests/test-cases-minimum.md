# Casos mínimos

1. Admin cria ou recupera connected account
2. Admin obtém onboarding link
3. Connect status retorna `ready` apenas quando `charges_enabled=true` e `payouts_enabled=true`
4. Recipe sem `stripe_price_id` dispara sync
5. Checkout cria uma sessão Stripe com idempotência
6. Repetição com mesma idempotency key reutiliza a mesma ordem
7. Webhook `checkout.session.completed` aprova pedido
8. Evento duplicado não cria segundo entitlement
9. Webhook inválido retorna 400
10. Repair manual não roda sem autorização
11. `rg` final não encontra Mercado Pago no runtime
