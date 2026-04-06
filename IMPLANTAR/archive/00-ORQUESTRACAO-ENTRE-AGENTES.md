# Orquestracao de Execucao pela pasta IMPLANTAR

Projeto: Receitas Bell  
Estado final obrigatorio: deploy READY, admin funcional, dominio correto, somente main, checklist final validado.  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo deste arquivo

Este arquivo define como o trabalho deve acontecer a partir de agora.

Existe separacao obrigatoria entre:

- **Agente Pensante**: analisa, valida, aprova ou reprova cada passo.
- **Agente Executor**: executa apenas uma movimentacao por vez, registra evidencias e para.

Nenhum passo deve pular para o seguinte sem validacao explicita do Agente Pensante.

---

## 2. Ordem obrigatoria de leitura

Antes de qualquer acao, o Agente Executor deve ler nesta ordem:

1. `IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md`
2. `IMPLANTAR/STATUS-EXECUCAO.md`
3. `IMPLANTAR/dossie-antigravidade-executor.md`
4. `IMPLANTAR/dossie-agente-executor-receitasbell.md`

Se houver conflito entre arquivos:

1. prevalece este arquivo
2. depois `STATUS-EXECUCAO.md`
3. depois o dossie mais novo
4. por ultimo o dossie mais antigo

---

## 3. Regra operacional principal

O Agente Executor deve trabalhar em ciclos curtos.

### Regra dura

**Uma movimentacao por vez.**

Exemplos de uma unica movimentacao:

- ajustar 1 variavel/config na Vercel
- rodar 1 validacao no Supabase
- executar 1 smoke test
- fazer 1 commit
- fazer 1 deploy
- validar 1 dominio/host
- atualizar 1 arquivo de status

### Proibicoes

O Agente Executor nao pode:

- executar varias mudancas em lote sem registrar
- seguir para a proxima fase sem validacao
- apagar ou sobrescrever os arquivos em `IMPLANTAR/`
- tomar decisao arquitetural nova
- mudar contrato existente sem justificativa documentada
- inventar resultado, status, URL, credencial ou evidência

---

## 4. Fluxo obrigatorio entre Pensante e Executor

### Ciclo padrao

1. O Agente Executor escolhe **somente a proxima movimentacao autorizada**.
2. Antes de agir, ele atualiza `IMPLANTAR/STATUS-EXECUCAO.md` na secao:
   - `PASSO EM EXECUCAO`
   - `OBJETIVO`
   - `RISCO`
   - `ROLLBACK`
3. Ele executa apenas esse passo.
4. Ele registra em `IMPLANTAR/STATUS-EXECUCAO.md`:
   - o que fez
   - quais arquivos mexeu
   - quais comandos rodou
   - qual foi a evidencia
   - se passou ou falhou
5. Ele para.
6. O Agente Pensante le o status, analisa a evidencia e responde com um de tres estados:
   - `OK PARA PROXIMO PASSO`
   - `AJUSTAR E REPETIR ESTE PASSO`
   - `ROLLBACK IMEDIATO`
7. Somente depois disso o Executor pode ir para o proximo passo.

---

## 5. Formato obrigatorio de atualizacao do Executor

Toda atualizacao em `IMPLANTAR/STATUS-EXECUCAO.md` deve usar este modelo:

```md
## PASSO N

**Titulo**: nome curto do passo  
**Status**: EM EXECUCAO | AGUARDANDO VALIDACAO | APROVADO | REPROVADO | ROLLBACK  
**Objetivo**: o que este passo resolve  
**Arquivos-alvo**: lista objetiva  
**Comandos executados**: bloco de codigo  
**Evidencias**: output, URL, status, print textual, logs curtos  
**Resultado observado**: o que aconteceu de fato  
**Risco**: baixo | medio | alto  
**Rollback**: comando exato ou acao exata  
**Proximo passo sugerido pelo Executor**: apenas 1  
**Aguardando decisao do Pensante**: SIM
```

Sem esse formato, o passo sera considerado invalido.

---

## 6. Sequencia obrigatoria de trabalho

O Executor deve seguir esta ordem macro, sempre um passo por vez:

1. Confirmar estado real atual de `main`, Vercel, Supabase e dominio.
2. Confirmar se o admin autentica no dominio correto.
3. Resolver o que estiver quebrado no menor raio de impacto.
4. Validar smoke do admin.
5. Garantir deploy de producao com status `READY`.
6. Validar dominio final usado pelo tenant principal.
7. Atualizar checklist final.
8. Encerrar com resumo final e sem pendencias operacionais abertas.

---

## 7. Foco atual obrigatorio

O foco agora nao e reabrir a investigacao inteira.

O foco atual e fechar o delta entre:

- codigo atual em `main`
- banco Supabase atual
- configuracao da Vercel atual
- dominio/host resolvido pelo tenant principal
- deploy de producao realmente pronto

---

## 8. Critérios de aprovacao por passo

O Agente Pensante so pode aprovar um passo se houver evidencia verificavel.

### Evidencia minima aceitavel

- comando executado
- resultado observavel
- arquivo alterado, se houver
- status objetivo (`200`, `401`, `READY`, `CANCELED`, `owner`, `password_hash=true`, etc.)

### Nao e evidencia suficiente

- "parece certo"
- "acho que foi"
- "deve ter funcionado"
- "na minha opiniao"

---

## 9. Regras de nao-quebra

Aplicar em todo passo:

- mudar o minimo necessario
- validar antes de prosseguir
- rollback definido antes da execucao
- nao alterar varias frentes ao mesmo tempo
- nao trocar dominio, auth e deploy no mesmo passo sem validacao intermediaria
- se um passo tocar auth ou producao, o passo seguinte obrigatorio e de validacao

---

## 10. Estado final obrigatorio

O trabalho so termina quando tudo abaixo estiver verdadeiro:

- existe apenas `main`
- admin funcional no tenant principal
- tenant principal aponta para o dominio correto
- deploy de producao com status `READY`
- smoke test final aprovado
- `IMPLANTAR/STATUS-EXECUCAO.md` marcado como concluido
- nenhum P0 ou P1 operacional pendente

---

## 11. Instrucao final ao Executor

Leia este arquivo inteiro.
Atualize `IMPLANTAR/STATUS-EXECUCAO.md`.
Execute apenas um passo.
Registre tudo.
Pare.
Aguarde validacao do Agente Pensante.

Nao pule etapa.
Nao acelere por conta propria.
Nao improvise.
