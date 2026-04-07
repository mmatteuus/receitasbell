# Frentes Ativas

Ultima atualizacao: 2026-04-06

## FRENTE-1 - Stripe Backend Core
- Status: EM_PROGRESSO
- Dono atual: ChatGPT
- Objetivo: alinhar checkout, repo, webhook e persistencia Stripe ao schema real
- Escopo protegido:
  - src/server/payments/repo.ts
  - src/server/payments/application/handlers/checkout/session.ts
  - src/server/payments/application/handlers/webhooks/stripe.ts
  - PR #6
- Tarefa principal: TASK-004
- Saida esperada: merge do PR tecnico Stripe
- Handoff se travar: OpenCode executor

## FRENTE-2 - Producao Canonica e Cutover
- Status: PENDENTE
- Dono atual: Antigravity
- Objetivo: confirmar Vercel canico, Stripe canico, webhook real e secrets
- Escopo protegido:
  - Vercel Dashboard do projeto canonico
  - Stripe Dashboard da plataforma canonica
  - TASK-006
  - TASK-001
- Tarefa principal: TASK-006
- Saida esperada: dominio real, webhook real, whsec real, secrets prontos
- Handoff se travar: registrar bloqueio em LOG-ATIVIDADE-AGENTES.md

## FRENTE-3 - Validacao, Rollout e Hardening
- Status: PENDENTE
- Dono atual: livre
- Objetivo: validar gate, smoke test, rate limit e estabilizacao pos merge
- Escopo protegido:
  - TASK-005
  - validacao de deploy
  - smoke test de compra
- Dependencia: FRENTE-1 concluida e FRENTE-2 pronta
- Handoff se travar: registrar AGUARDANDO_HANDOFF

## Regra de alocacao
- Se uma frente estiver EM_PROGRESSO, outro agente deve pegar outra frente.
- Ninguem pode pegar FRENTE-1 sem lock explicito do orquestrador.
- Ninguem pode fazer cutover LIVE sem FRENTE-1 concluida.
