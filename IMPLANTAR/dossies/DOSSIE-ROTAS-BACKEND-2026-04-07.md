# Dossie de Rotas do Backend

Data: 2026-04-07
Status: auditoria inicial concluida

## Entradas confirmadas
- api/auth/[...path].ts
- api/me/[...path].ts
- api/jobs/[...path].ts
- api/health/[...path].ts
- api/admin/[...path].ts
- api/payments/[...path].ts
- api/settings.ts

## Achados principais
1. O backend usa dois estilos de roteamento ao mesmo tempo:
   - filesystem routing direto
   - rewrites no vercel.json
2. `payments` e `admin` usam rewrite explicito no vercel.json.
3. `auth`, `me`, `jobs` e `health` entram por arquivo catch-all, sem o mesmo padrao de rewrite.
4. A rota correta do webhook Stripe e:
   - `/api/payments/webhooks/stripe`
   - alias aceito: `/api/payments/webhook`
5. A rota antiga `/api/payments/stripe/webhook` deve ser tratada como proibida.

## Riscos reais
- risco de operador configurar webhook na rota errada
- risco de outro agente assumir que todo modulo precisa de rewrite e quebrar path parsing
- risco de regressao ao mexer em vercel.json sem auditar os catch-all routers
- risco de deploy aparentemente saudavel com webhook quebrado por path incorreto

## Recomendacoes imediatas
- nao alterar vercel.json enquanto o cutover Stripe estiver em andamento
- monitorar somente webhook, payments e health durante o cutover
- apos estabilizar Stripe, padronizar a estrategia de roteamento do backend

## Monitorar durante o trabalho do Antigravity
- PR #6
- webhook Stripe real
- `/api/payments/webhooks/stripe`
- `/api/health`
- `/api/health/ready`

## Proximo dossie tecnico sugerido
- padronizacao de routing backend e simplificacao do vercel.json
