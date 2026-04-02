# Protocolo de Orquestração — Pensante ↔ Executor

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Objetivo

Criar um barramento operacional simples, rastreável e sem ambiguidade dentro de `IMPLANTAR/` para que:
- o Pensante planeje
- o Executor execute
- ambos saibam exatamente:
  - o que foi pedido
  - o que foi feito
  - o que não foi feito
  - por que não foi feito
  - qual é o próximo passo

---

## Regra central

O Executor não decide arquitetura.

O Pensante não assume execução concluída sem evidência escrita pelo Executor.

Toda comunicação operacional entre os dois deve deixar rastro em arquivo Markdown dentro de `IMPLANTAR/`.

---

## Arquivos canônicos de conversa

### 1. Planejamento do Pensante
Arquivo:
- `IMPLANTAR/18-PLANO-MESTRE-DE-EXECUCAO.md`

Função:
- lista oficial das tarefas
- ordem oficial de execução
- definição de pronto
- critérios de aceite

Somente o Pensante altera a estratégia.

### 2. Retorno do Executor
Arquivo:
- `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`

Função:
- registrar tarefa executada
- dizer se concluiu ou não concluiu
- explicar evidência
- explicar bloqueio
- explicar por que não fez

Somente o Executor escreve a seção nova de retorno.

### 3. Bloqueios e pendências
Arquivo:
- `IMPLANTAR/20-BLOQUEIOS-E-NAO-EXECUTADO.md`

Função:
- lista consolidada do que não foi feito
- motivo
- impacto
- decisão exigida do Pensante

### 4. Estado canônico
Arquivo:
- `IMPLANTAR/21-ESTADO-CANONICO-DA-EXECUCAO.md`

Função:
- snapshot curto do estado atual
- último passo concluído
- passo atual
- próximo passo obrigatório
- dono atual da ação

---

## Fluxo obrigatório

### Etapa A — Pensante planeja
O Pensante deve:
1. atualizar `18-PLANO-MESTRE-DE-EXECUCAO.md`
2. definir qual task está liberada
3. atualizar `21-ESTADO-CANONICO-DA-EXECUCAO.md`

### Etapa B — Executor executa
O Executor deve:
1. ler `18-PLANO-MESTRE-DE-EXECUCAO.md`
2. executar apenas a próxima task liberada
3. registrar o resultado em `19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`
4. se falhar ou não conseguir, registrar também em `20-BLOQUEIOS-E-NAO-EXECUTADO.md`
5. atualizar o status da task no plano

### Etapa C — Pensante replaneja
O Pensante deve:
1. ler o retorno do Executor
2. validar evidências
3. decidir próxima task
4. corrigir plano ou desbloquear caminho

---

## Status permitidos

Usar apenas estes status:
- `PENDENTE`
- `LIBERADA`
- `EM_EXECUCAO`
- `CONCLUIDA`
- `NAO_CONCLUIDA`
- `BLOQUEADA`
- `DESCARTADA`

Não inventar status novos.

---

## Regra de evidência mínima

Nenhuma task pode ser marcada como `CONCLUIDA` sem pelo menos um destes:
- comando executado
- output relevante
- resposta HTTP
- print descrito
- deploy id
- query SQL
- arquivo criado/alterado

---

## Regra para “não foi feito”

Se o Executor não concluir uma task, ele deve obrigatoriamente registrar:
- status: `NAO_CONCLUIDA` ou `BLOQUEADA`
- motivo técnico
- ponto exato da falha
- o que tentou
- o que falta para resolver
- se existe risco de quebrar o projeto

Sem isso, o retorno é inválido.

---

## Regra de não-quebra

Antes de executar qualquer task, o Executor deve declarar no retorno:
- mudança é aditiva ou não
- risco de quebra
- rollback disponível ou não

---

## Regra de contexto contínuo

Antes de iniciar nova task:
1. ler `18-PLANO-MESTRE-DE-EXECUCAO.md`
2. ler `19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`
3. ler `20-BLOQUEIOS-E-NAO-EXECUTADO.md`
4. ler `21-ESTADO-CANONICO-DA-EXECUCAO.md`

Se não ler esses quatro, está sem contexto.

---

## Proibição

- não apagar histórico anterior
- não sobrescrever retorno antigo
- não resumir sem manter o motivo técnico
- não marcar como concluído sem evidência
- não pular task sem registrar motivo

---

## Regra final

Se houver divergência entre arquivos, a ordem de autoridade é:
1. `21-ESTADO-CANONICO-DA-EXECUCAO.md`
2. `18-PLANO-MESTRE-DE-EXECUCAO.md`
3. `20-BLOQUEIOS-E-NAO-EXECUTADO.md`
4. `19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`
