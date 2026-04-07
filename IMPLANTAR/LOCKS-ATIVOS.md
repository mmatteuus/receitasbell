# Locks Ativos

Ultima atualizacao: 2026-04-06

## LOCK-STRIPE-CORE-001
- Status: EM_PROGRESSO
- Agente: ChatGPT
- Frente: FRENTE-1
- Tarefa: TASK-004
- Escopo:
  - src/server/payments/repo.ts
  - src/server/payments/application/handlers/checkout/session.ts
  - src/server/payments/application/handlers/webhooks/stripe.ts
  - PR #6
- Branch ou PR: fix-stripe-prod-chatgpt / PR #6
- Iniciado em: 2026-04-07 00:23 UTC
- Libera quando: PR #6 for mergeado ou handoff explicito for registrado
- Proximo passo: mergear patch tecnico e alinhar entitlements.repo.ts

## LOCK-STRIPE-PROD-001
- Status: PENDENTE
- Agente: Antigravity
- Frente: FRENTE-2
- Tarefa: TASK-006
- Escopo:
  - Stripe Dashboard
  - Vercel Dashboard
  - webhook real
  - secrets de producao
- Branch ou PR: sem branch
- Iniciado em: aguardando
- Libera quando: dominio e conta canonicos estiverem confirmados e registrados
- Proximo passo: executar TASK-006 sem alterar codigo

## Regras de lock
- Qualquer novo lock deve ser adicionado antes do trabalho começar.
- Se o escopo colidir com lock ativo, o agente deve parar.
- Ao concluir, trocar status para CONCLUIDO ou AGUARDANDO_HANDOFF.
