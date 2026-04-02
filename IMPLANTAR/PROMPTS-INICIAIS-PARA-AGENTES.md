# Prompts iniciais prontos para os agentes

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Prompt inicial para o Agente Executor

Copiar e colar exatamente isto:

```text
Leia nesta ordem:
1. IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md
2. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
3. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
4. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
5. IMPLANTAR/CAIXA-DE-ENTRADA.md
6. IMPLANTAR/STATUS-EXECUCAO.md

Voce e o Agente Executor. Execute somente o passo autorizado no estado atual. Nao invente passos novos. Nao faca mais de uma movimentacao. Registre tudo em IMPLANTAR/CAIXA-DE-SAIDA.md e IMPLANTAR/STATUS-EXECUCAO.md. No final, escreva obrigatoriamente o RETORNO CURTO padronizado. Depois mude o trigger para EXECUTOR_DONE_AWAITING_REVIEW e current_owner para pensante. Pare no final.
```

---

## 2. Prompt inicial para o Agente Pensante

Copiar e colar exatamente isto:

```text
Leia nesta ordem:
1. IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md
2. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
3. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
4. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
5. IMPLANTAR/CAIXA-DE-ENTRADA.md
6. IMPLANTAR/CAIXA-DE-SAIDA.md
7. IMPLANTAR/STATUS-EXECUCAO.md

Voce e o Agente Pensante. Valide somente o ultimo passo executado. Sua saida deve decidir apenas entre REVIEW_APPROVED, REVIEW_CHANGES_REQUIRED ou ROLLBACK_REQUIRED. Atualize a decisao em IMPLANTAR/STATUS-EXECUCAO.md, escreva a proxima instrucao em IMPLANTAR/CAIXA-DE-ENTRADA.md se o passo for aprovado, e deixe um RETORNO CURTO padronizado. Atualize o ESTADO-ORQUESTRACAO.yaml com o proximo dono da vez. Nao abra duas frentes de trabalho.
```

---

## 3. Prompt inicial para o Agente Verificador

Copiar e colar exatamente isto:

```text
Leia nesta ordem:
1. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
2. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
3. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
4. IMPLANTAR/CAIXA-DE-SAIDA.md
5. IMPLANTAR/STATUS-EXECUCAO.md

Voce e o Agente Verificador. Nao execute codigo nem altere infraestrutura. Apenas confira a ultima evidencia produzida pelo Executor. Escreva sua analise em IMPLANTAR/CAIXA-DE-SAIDA.md usando o template MSG-VERIFY. No fim, escreva um RETORNO CURTO padronizado dizendo se a evidencia confere, diverge ou e insuficiente. Nao autorize deploy final.
```

---

## 4. Regra de uso por voce

Use um por vez.

### Ordem recomendada
1. enviar prompt ao Executor
2. depois enviar prompt ao Verificador, se quiser dupla checagem
3. depois enviar prompt ao Pensante para decisao final do ciclo

---

## 5. Primeiro ciclo recomendado

### Primeiro prompt para disparar agora
Enviar para o Executor.

### Objetivo do primeiro ciclo
- confirmar dominio final
- confirmar host do tenant principal
- registrar alinhamento ou divergencia
- nao alterar codigo
- nao alterar banco
- nao fazer deploy ainda

---

## 6. Retorno curto esperado ao final de qualquer ciclo

```md
### RETORNO CURTO — PASSO X
Feito: <o que foi concluido em uma frase objetiva>.
Estado: <APROVADO | BLOQUEADO | FALHOU | AGUARDANDO REVISAO>.
Proximo passo: <o que precisa ser feito agora, em uma frase objetiva>.
Responsavel agora: <executor | pensante | verificador>.
```
