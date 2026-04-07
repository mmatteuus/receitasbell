# Antigravity - Stripe Producao

Agente: Antigravity
Ramo: main
Modo: executar

## Antes de iniciar
- git pull origin main
- ler IMPLANTAR/MAIN-ONLY.md
- registrar atividade

## Ordem exata
1. Mergear PR #7 no main.
2. Mergear PR #6 no main.
3. Confirmar projeto Vercel canonico.
4. Confirmar conta Stripe canonica.
5. Configurar webhook na rota `/api/payments/webhooks/stripe`.
6. Garantir eventos:
   - checkout.session.completed
   - checkout.session.async_payment_succeeded
   - checkout.session.async_payment_failed
   - account.updated
7. Copiar whsec real.
8. Atualizar no Vercel:
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PUBLISHABLE_KEY se existir
9. Fazer redeploy.
10. Fazer smoke test de checkout, webhook, payment_orders e acesso.

## Nao fazer
- nao criar branch
- nao usar `/api/payments/stripe/webhook`
- nao improvisar se falhar

## Se falhar
- parar
- registrar no log
- marcar aguardando handoff
