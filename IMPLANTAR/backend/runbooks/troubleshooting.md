# Troubleshooting

## Sintoma: checkout não abre
- validar `STRIPE_SECRET_KEY`
- validar `connect/status`
- validar `stripe_price_id` da receita
- validar build/deploy atual

## Sintoma: cliente pagou e não liberou acesso
- validar webhook Stripe
- validar dedupe em `payment_events`
- validar `Payment_Orders.status`
- validar `Entitlements`

## Sintoma: onboarding não conclui
- validar `account.updated`
- validar `requirements_currently_due_json`
- validar país/capabilities

## Sintoma: deploy sobe mas runtime ainda cita MP
- validar `vercel.json`
- rodar:
```bash
rg -n "mercadopago|mercado_pago|mp_" .
```
