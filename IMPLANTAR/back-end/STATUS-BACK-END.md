# Status do Back-end

Ultima atualizacao: 2026-04-07

## Situacao atual
- Stripe ainda depende de cutover real em producao.
- Existe um PR tecnico aberto para alinhar checkout e webhook Stripe.
- Existe trabalho de auditoria de rotas em andamento.
- O backend esta sendo reorganizado para operar por uma trilha canonica em `IMPLANTAR/back-end`.

## Frentes do back-end
### FRENTE-BE-1 - Stripe Core
- Status: EM_PROGRESSO
- Objetivo: alinhar schema, checkout, webhook e persistencia

### FRENTE-BE-2 - Producao Canonica
- Status: EM_PROGRESSO pelo agente executor
- Objetivo: webhook real, projeto real, conta real, secrets e deploy

### FRENTE-BE-3 - Auditoria e Hardening
- Status: EM_PROGRESSO
- Objetivo: rotas, guards, health, riscos de regressao e dossies extras

## Riscos principais
- webhook configurado na rota errada
- deploy saudavel com webhook quebrado
- inconsistencias entre docs antigos e trilha nova
- agentes agindo sem responder na caixa de saida

## Regra operacional
Toda atualizacao nova de backend deve apontar para esta pasta.
