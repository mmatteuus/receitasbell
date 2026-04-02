# Gatilhos de Conversa e Automacao Operacional na pasta IMPLANTAR

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Verdade operacional

Nao existe conversa realmente simultanea dentro do repositório por si so.

Para haver conversa funcional entre multiplos agentes dentro da pasta `IMPLANTAR/`, o modelo correto e usar:

1. **estado compartilhado**
2. **caixa de entrada**
3. **caixa de saida**
4. **gatilhos claros**
5. **um ator dono da vez**

Isso transforma a pasta `IMPLANTAR/` em um barramento simples de coordenacao.

---

## 2. Arquivos oficiais do barramento

Os agentes devem usar estes arquivos:

- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
- `IMPLANTAR/CAIXA-DE-ENTRADA.md`
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md`
- `IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md`

---

## 3. Quem escreve onde

### Agente Pensante
Escreve em:
- `CAIXA-DE-ENTRADA.md`
- `ESTADO-ORQUESTRACAO.yaml`
- `STATUS-EXECUCAO.md` na secao de decisao

### Agente Executor
Escreve em:
- `CAIXA-DE-SAIDA.md`
- `STATUS-EXECUCAO.md`
- arquivos de codigo quando autorizado

### Terceiro agente verificador ou auxiliar
Escreve em:
- `CAIXA-DE-SAIDA.md`
- `STATUS-EXECUCAO.md` apenas na propria secao identificada

---

## 4. Gatilhos oficiais

### Gatilho 1 — `READY_FOR_EXECUTOR`
Significa:
- o Pensante ja definiu o proximo passo
- o Executor esta autorizado a agir

### Gatilho 2 — `EXECUTOR_IN_PROGRESS`
Significa:
- o Executor assumiu o passo
- nenhum outro agente deve executar a mesma tarefa

### Gatilho 3 — `EXECUTOR_DONE_AWAITING_REVIEW`
Significa:
- o Executor terminou
- ha evidencias prontas para avaliacao
- o Pensante deve validar

### Gatilho 4 — `REVIEW_APPROVED`
Significa:
- o Pensante aprovou
- pode abrir a proxima instrucao

### Gatilho 5 — `REVIEW_CHANGES_REQUIRED`
Significa:
- o passo nao foi aceito
- o Executor deve corrigir somente o mesmo passo

### Gatilho 6 — `ROLLBACK_REQUIRED`
Significa:
- o Executor deve interromper o fluxo atual
- rollback obrigatorio antes de qualquer novo passo

### Gatilho 7 — `BLOCKED`
Significa:
- existe impedimento externo ou evidência insuficiente
- nenhum agente deve seguir sem destravar o bloqueio

### Gatilho 8 — `DONE`
Significa:
- objetivo final concluido
- sistema estabilizado
- pasta de implantacao encerrada

---

## 5. Regra do dono da vez

O arquivo `ESTADO-ORQUESTRACAO.yaml` sempre tera o campo `current_owner`.

Valores possiveis:
- `pensante`
- `executor`
- `verificador`
- `ninguem`

### Regra dura

So o agente apontado em `current_owner` pode agir no proximo ciclo.

---

## 6. Regra de semaforo

### Verde
- `READY_FOR_EXECUTOR`
- `REVIEW_APPROVED`

### Amarelo
- `EXECUTOR_IN_PROGRESS`
- `EXECUTOR_DONE_AWAITING_REVIEW`
- `BLOCKED`

### Vermelho
- `ROLLBACK_REQUIRED`

---

## 7. Fluxo minimo de automacao

### Ciclo completo

1. O Pensante atualiza `CAIXA-DE-ENTRADA.md` com apenas uma instrucao.
2. O Pensante atualiza `ESTADO-ORQUESTRACAO.yaml` para:
   - `trigger: READY_FOR_EXECUTOR`
   - `current_owner: executor`
3. O Executor le os arquivos.
4. O Executor muda o estado para:
   - `trigger: EXECUTOR_IN_PROGRESS`
   - `current_owner: executor`
5. O Executor executa apenas uma movimentacao.
6. O Executor registra evidencia em `CAIXA-DE-SAIDA.md` e `STATUS-EXECUCAO.md`.
7. O Executor muda o estado para:
   - `trigger: EXECUTOR_DONE_AWAITING_REVIEW`
   - `current_owner: pensante`
8. O Pensante valida.
9. O Pensante responde com apenas uma destas decisoes:
   - `REVIEW_APPROVED`
   - `REVIEW_CHANGES_REQUIRED`
   - `ROLLBACK_REQUIRED`
10. O ciclo recomeca.

---

## 8. Como automatizar de verdade sem confusao

A forma mais robusta dentro do repositório e:

### Nivel 1 — automacao leve
- agentes leem e escrevem nesses arquivos
- `ESTADO-ORQUESTRACAO.yaml` manda no fluxo
- `CAIXA-DE-ENTRADA.md` contem a instrucao atual
- `CAIXA-DE-SAIDA.md` contem a resposta atual

### Nivel 2 — automacao estruturada
Um agente auxiliar pode ser configurado para fazer polling da pasta `IMPLANTAR/` e obedecer esta regra:

- se `trigger = READY_FOR_EXECUTOR` e `current_owner = executor`, executar o passo
- se `trigger = EXECUTOR_DONE_AWAITING_REVIEW` e `current_owner = pensante`, parar e aguardar validacao
- se `trigger = REVIEW_CHANGES_REQUIRED`, repetir apenas o passo rejeitado
- se `trigger = ROLLBACK_REQUIRED`, executar rollback

### Nivel 3 — automacao com validador externo
Um agente verificador pode ler somente:
- `ESTADO-ORQUESTRACAO.yaml`
- `CAIXA-DE-SAIDA.md`
- `STATUS-EXECUCAO.md`

E produzir uma analise secundaria antes da resposta final do Pensante.

---

## 9. Regra contra corrida entre agentes

Para evitar dois agentes agirem ao mesmo tempo:

- qualquer agente que iniciar um passo precisa primeiro alterar `current_owner`
- se o estado ja estiver com outro dono, ele nao pode agir
- se houver conflito, prevalece o ultimo estado salvo em `ESTADO-ORQUESTRACAO.yaml`
- o Pensante arbitra conflitos

---

## 10. Estrutura padrao da mensagem

### Entrada do Pensante

```md
## MSG-IN-0001
**Destino**: executor
**Trigger de saida esperado**: EXECUTOR_DONE_AWAITING_REVIEW
**Passo autorizado**: PASSO 1
**Objetivo**: confirmar dominio final e host do tenant principal
**Instrucao exata**:
1. verificar host atual do tenant principal
2. verificar dominio atual na Vercel
3. comparar ambos
4. registrar evidencias
**Nao fazer**:
- nao alterar codigo
- nao fazer deploy
- nao mudar banco
**Criterio de aceite**:
- host atual identificado
- dominio atual identificado
- divergencia ou alinhamento documentado
```

### Saida do Executor

```md
## MSG-OUT-0001
**Origem**: executor
**Relacionado a**: MSG-IN-0001
**Status**: EXECUTOR_DONE_AWAITING_REVIEW
**Comandos executados**:
```bash
# comandos aqui
```
**Evidencias**:
```text
# evidencias aqui
```
**Resultado observado**: ...
**Bloqueios**: nenhum | listar
**Sugestao de proximo passo**: ...
```

---

## 11. Regra para o terceiro agente

Se existir um terceiro agente:

- ele nao substitui o Pensante
- ele nao autoriza deploy final
- ele funciona como verificador auxiliar ou executor auxiliar
- toda resposta dele deve ser marcada como `verificador`

---

## 12. Estado final esperado

A conversa por arquivos sera considerada funcional quando:

- o passo atual estiver claro
- o dono da vez estiver claro
- o trigger estiver claro
- a resposta estiver no arquivo correto
- o proximo passo depender apenas da leitura da pasta

Esse e o maximo nivel de automacao confiavel dentro da propria pasta `IMPLANTAR/`, sem depender de conversa manual a cada detalhe.
