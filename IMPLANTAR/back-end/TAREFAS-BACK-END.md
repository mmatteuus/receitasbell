# Tarefas do Back-end

Ultima atualizacao: 2026-04-07

## BE-001 - Stripe Core
- Status: EM_PROGRESSO
- Objetivo: alinhar checkout, webhook, eventos e persistencia
- Dependencias: nenhuma
- Evidencia atual: PR tecnico aberto do Stripe

## BE-002 - Producao Canonica
- Status: EM_PROGRESSO pelo executor
- Objetivo: confirmar Vercel real, Stripe real, webhook real e secrets reais
- Dependencias: leitura do executor do Antigravity

## BE-003 - Auditoria de Rotas
- Status: EM_PROGRESSO
- Objetivo: identificar rotas quebradas, duplicadas, erradas ou inconsistentes
- Dependencias: nenhuma
- Saida: dossie de rotas do backend

## BE-004 - Hardening Pos-Cutover
- Status: PENDENTE
- Objetivo: validar smoke test, health e riscos de regressao apos configuracao real
- Dependencias: BE-001 e BE-002

## Regra
Todo agente de backend deve responder em `IMPLANTAR/CAIXA-DE-SAIDA.md` ao concluir ou bloquear qualquer uma destas tarefas.
