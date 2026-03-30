# Capacity planning

## Direção
- 1 function pública principal para pagamentos
- webhook como fluxo principal
- sem cron reconcile contínuo
- sync de catálogo apenas em mutation relevante

## Custos
- minimizar chamadas duplicadas a Stripe
- minimizar writes redundantes em Baserow
- reduzir surface area no Vercel

## Indicadores
- invocações por checkout
- writes por pedido
- retries por provider
- error rate por rota
