# Fases de Execução — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Regra

Este arquivo organiza a execução por fases.
O Executor deve seguir fase por fase, sem pular ordem e sem inventar fluxo.

---

## FASE 1 — Preparação e ambiente

Objetivo:
- garantir que o ambiente suporta a execução sem mexer no código ainda

Tasks:
- `STRIPE-001` confirmar envs obrigatórias na Vercel

Saída esperada:
- variáveis obrigatórias confirmadas
- nenhum segredo exposto em arquivo markdown

---

## FASE 2 — Base técnica do backend

Objetivo:
- criar a fundação reutilizável do Stripe Connect no backend

Tasks:
- `STRIPE-002` criar utilitários backend do Stripe Connect

Saída esperada:
- `_lib/stripe.ts`
- `_lib/supabase-admin.ts`
- `_lib/connect-store.ts`

---

## FASE 3 — Recuperar rotas quebradas

Objetivo:
- eliminar os `404` atuais do frontend

Tasks:
- `STRIPE-003` criar endpoint `/api/payments/connect/account`
- `STRIPE-004` criar endpoint `/api/payments/connect/onboarding-link`

Saída esperada:
- duas rotas críticas passam a responder `200`
- frontend deixa de falhar por rota inexistente

---

## FASE 4 — Estado e continuidade do onboarding

Objetivo:
- permitir que o fluxo volte, consulte status e continue sem ambiguidade

Tasks:
- `STRIPE-005` criar endpoint `/api/payments/connect/status`
- `STRIPE-006` criar endpoint `/api/payments/connect/refresh`
- `STRIPE-007` criar endpoint `/api/payments/connect/return`

Saída esperada:
- status sincronizado
- refresh funcional
- return funcional

---

## FASE 5 — Sincronização automática

Objetivo:
- manter o estado da conta Stripe atualizado mesmo fora da navegação manual

Tasks:
- `STRIPE-008` criar webhook `/api/payments/webhook`
- `STRIPE-009` validar banco `public.stripe_connect_accounts`

Saída esperada:
- webhook processando `account.updated`
- tabela refletindo estado atual do connect

---

## FASE 6 — Gate, deploy e prova final

Objetivo:
- provar que a correção funciona no ambiente real

Tasks:
- `STRIPE-010` rodar gate e publicar na `main`
- `STRIPE-011` validar produção e encerrar o `404`

Saída esperada:
- `npm run gate` ok
- deploy READY
- painel admin funcional
- Stripe Connect iniciando sem `404`

---

## Regra de avanço entre fases

Só avançar de fase quando:
- a fase anterior estiver com status concluído
- o retorno do Executor estiver escrito em `19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`
- qualquer falha estiver registrada em `20-BLOQUEIOS-E-NAO-EXECUTADO.md`

---

## Regra final

Se uma fase falhar:
- não pular para a próxima
- registrar bloqueio
- devolver contexto ao Pensante
- aguardar replanejamento
