# Padrao obrigatorio de retorno curto entre agentes

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Todo agente que terminar um passo deve deixar um retorno curto, padronizado e legivel em 3 a 4 linhas.

Esse retorno curto existe para:

- dizer rapidamente o que acabou de ser feito
- dizer se passou, falhou ou ficou bloqueado
- dizer o proximo passo
- dizer quem deve agir agora

Esse retorno evita que outro agente fique perdido.

---

## 2. Regra dura

Ao terminar qualquer passo, o agente deve sempre escrever duas coisas:

1. o bloco tecnico completo em `IMPLANTAR/CAIXA-DE-SAIDA.md`
2. o bloco curto padronizado em `IMPLANTAR/STATUS-EXECUCAO.md`

Sem o bloco curto, o passo sera considerado incompleto.

---

## 3. Formato obrigatorio do retorno curto

Usar sempre exatamente este formato:

```md
### RETORNO CURTO — PASSO X
Feito: <o que foi concluido em uma frase objetiva>.
Estado: <APROVADO | BLOQUEADO | FALHOU | AGUARDANDO REVISAO>.
Proximo passo: <o que precisa ser feito agora, em uma frase objetiva>.
Responsavel agora: <executor | pensante | verificador>.
```

---

## 4. Exemplos validos

### Exemplo 1

```md
### RETORNO CURTO — PASSO 1
Feito: dominio atual da Vercel e host do tenant principal foram comparados.
Estado: AGUARDANDO REVISAO.
Proximo passo: o Pensante deve validar se existe divergencia entre dominio e host.
Responsavel agora: pensante.
```

### Exemplo 2

```md
### RETORNO CURTO — PASSO 2
Feito: o ultimo deploy de producao foi conferido e o status READY foi validado.
Estado: APROVADO.
Proximo passo: executar smoke test do admin no dominio correto.
Responsavel agora: executor.
```

### Exemplo 3

```md
### RETORNO CURTO — PASSO 3
Feito: o smoke test do admin falhou com 401 no dominio principal.
Estado: BLOQUEADO.
Proximo passo: o Pensante deve analisar se o problema esta no host, sessao ou dados de auth.
Responsavel agora: pensante.
```

---

## 5. Onde escrever o retorno curto

### Em `STATUS-EXECUCAO.md`
Sempre adicionar o retorno curto logo abaixo do bloco tecnico completo do passo.

### Em `CAIXA-DE-SAIDA.md`
No final de cada mensagem do Executor ou do Verificador, repetir o mesmo retorno curto.

---

## 6. Regra de leitura pelo proximo agente

Todo agente que iniciar um novo ciclo deve ler nesta ordem:

1. `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
2. o ultimo `RETORNO CURTO` em `IMPLANTAR/STATUS-EXECUCAO.md`
3. a ultima mensagem em `IMPLANTAR/CAIXA-DE-ENTRADA.md`
4. a ultima mensagem em `IMPLANTAR/CAIXA-DE-SAIDA.md`

Se houver conflito:

1. vale o `ESTADO-ORQUESTRACAO.yaml`
2. depois a ultima decisao do Pensante
3. depois o ultimo retorno curto

---

## 7. Regra semantica do campo Estado

Usar somente estes valores:

- `AGUARDANDO REVISAO` → Executor terminou e o Pensante precisa validar
- `APROVADO` → passo aceito, proximo pode abrir
- `BLOQUEADO` → impedimento externo ou evidência insuficiente
- `FALHOU` → execucao incorreta ou resultado invalido

---

## 8. Regra do proximo passo

O campo `Proximo passo` deve sempre:

- caber em uma linha
- indicar apenas uma acao
- nao abrir duas frentes ao mesmo tempo
- ser executavel
- dizer com clareza o que o outro agente deve fazer

---

## 9. Regra do responsavel agora

Usar somente um valor:

- `executor`
- `pensante`
- `verificador`

Nunca listar dois responsaveis ao mesmo tempo.

---

## 10. Instrucao final

A partir deste arquivo, nenhum agente deve encerrar um passo sem deixar o retorno curto padronizado.

Esse retorno curto e o resumo oficial entre os agentes.
