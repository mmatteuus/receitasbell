# Protocolo de Orquestracao dos Agentes A

Status: REGRA OBRIGATORIA
Ultima atualizacao: 2026-04-06

## Ordem obrigatoria de leitura
1. IMPLANTAR/TASK-TRACKER.md
2. IMPLANTAR/FRENTES-ATIVAS.md
3. IMPLANTAR/LOCKS-ATIVOS.md
4. IMPLANTAR/LOG-ATIVIDADE-AGENTES.md
5. arquivo da tarefa em IMPLANTAR/tasks

Sem lock e sem log, o agente nao deve iniciar.

## Regras principais
- Um agente por area editavel por vez.
- Todo trabalho deve declarar escopo exato.
- Dashboard tambem conta como area de trabalho.
- Takeover so com handoff explicito ou lock liberado.
- Ao concluir, o agente deve deixar contexto reutilizavel.

## Campos minimos do lock
- id do lock
- status
- agente
- frente
- tarefa
- escopo
- branch ou PR
- horario de inicio
- condicao de liberacao
- proximo passo

## Campos minimos do log
- horario
- agente
- frente
- tarefa
- acao executada
- escopo tocado
- branch PR ou commit
- resultado
- proximo passo
- handoff para proximo agente

## Tres frentes de trabalho
1. Stripe Backend Core
2. Producao Canonica e Cutover
3. Validacao Rollout e Hardening

Se uma frente ja tiver dono ativo, outro agente deve pegar outra frente.

## Status padrao
- PENDENTE
- EM_PROGRESSO
- EM_REVISAO
- AGUARDANDO_HANDOFF
- BLOQUEADO
- CONCLUIDO

## Resultado esperado
Lendo apenas IMPLANTAR, qualquer agente deve conseguir entender:
- quem esta fazendo o que
- onde esta mexendo
- o que ja foi feito
- o que falta
- o que esta bloqueado
- qual proxima tarefa pode ser pega sem colisao
