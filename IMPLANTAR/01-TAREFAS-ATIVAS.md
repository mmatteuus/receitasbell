# Tarefas Ativas

Ultima atualizacao: 2026-04-06

## TASK-001 - Cutover Stripe LIVE
- Status: BLOQUEADO
- Dono: Antigravity
- So pode iniciar depois de:
  - TASK-004 concluida
  - TASK-006 concluida
- Observacao: nao trocar env vars LIVE antes disso

## TASK-004 - Corrigir drift Stripe e Webhook
- Status: EM_PROGRESSO
- Dono: ChatGPT
- Evidencia: PR #6 aberto
- Escopo:
  - src/server/payments/repo.ts
  - src/server/payments/application/handlers/checkout/session.ts
  - src/server/payments/application/handlers/webhooks/stripe.ts

## TASK-006 - Confirmar producao canonica
- Status: PENDENTE
- Dono: Antigravity
- Escopo:
  - Stripe Dashboard
  - Vercel Dashboard
  - webhook real
  - secrets reais

## TASK-005 - Validacao e hardening
- Status: PENDENTE
- Dependencia: TASK-004 e TASK-006

## Fonte de verdade
1. IMPLANTAR/PROTOCOLO-ORQUESTRACAO-AGENTES.md
2. IMPLANTAR/FRENTES-ATIVAS.md
3. IMPLANTAR/LOCKS-ATIVOS.md
4. IMPLANTAR/LOG-ATIVIDADE-AGENTES.md
