# 02-PLANO-DE-FECHAMENTO-NO-GRATIS.md [PENDENTE]
> [!NOTE]
> STATUS: PENDENTE - Roadmap de fases B a E.

# Plano de fechamento no gratis

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Fechar o sistema no plano gratis, com o menor numero possivel de frentes abertas, ate ficar funcional sem erros bloqueantes.

Este arquivo existe para impedir dispersao.

A partir de agora, o trabalho deve seguir esta regra:

- fechar primeiro o que bloqueia funcionamento real
- nao abrir frente nova antes de concluir a atual
- nao otimizar processo antes de estabilizar produto
- nao mexer em dominio pago nem em plano pago agora

---

## 2. Diagnostico resumido

### FATO
- ja existe pelo menos um deploy de producao em estado `READY`
- o dominio principal responde
- o endpoint de sessao admin sem login responde corretamente
- a pasta `IMPLANTAR/` virou o barramento oficial de execucao
- existe MVP da automacao local com daemon, lock, heartbeat e task de startup
- ha varios deploys recentes em estado `CANCELED`
- o estado oficial da pasta `IMPLANTAR/` ficou defasado em relacao ao que ocorreu na operacao
- o smoke test completo do admin ainda nao foi provado com evidencias consistentes dentro da pasta oficial

### CONCLUSAO
O problema principal agora nao e plano gratis.
O problema principal agora e execucao dispersa e evidencia incompleta.

---

## 3. Regra de foco

## O que entra no escopo agora

Somente estas frentes:

1. sincronizar a pasta `IMPLANTAR/` com a realidade atual
2. provar login admin completo no dominio final
3. corrigir apenas o menor delta que impedir esse login
4. repetir o smoke ate passar
5. validar encerramento sem P0 e P1 abertos

## O que fica fora do escopo agora

Nao fazer nesta etapa:

- dominio customizado pago
- refatoracao ampla
- novas automacoes remotas
- novas integracoes opcionais
- observabilidade avancada
- limpeza prematura de artefatos ainda uteis
- qualquer frente nao ligada ao funcionamento real do sistema

---

## 4. Ordem obrigatoria de execucao

## Fase A — Sincronizar o barramento oficial

**Objetivo**: fazer a pasta `IMPLANTAR/` refletir o estado real do projeto.

### O que precisa acontecer
- revisar `ESTADO-ORQUESTRACAO.yaml`
- revisar `STATUS-EXECUCAO.md`
- revisar `CAIXA-DE-ENTRADA.md`
- revisar `CAIXA-DE-SAIDA.md`
- registrar que o deploy valido existe
- registrar que o passo da automacao local foi concluido
- abrir oficialmente o passo seguinte correto

### Critério de aceite
- o estado oficial nao contradiz mais a operacao real
- o proximo passo fica claro
- o dono da vez fica claro

---

## Fase B — Provar autenticacao admin completa

**Objetivo**: sair do estado "parece que funciona" e entrar em "foi provado que funciona".

### O que precisa acontecer
1. registrar `GET /api/admin/auth/session` sem sessao
2. executar login admin no dominio final
3. registrar resposta do login
4. registrar cookie/sessao se houver
5. executar `GET /api/admin/auth/session` apos login
6. registrar o resultado final

### Critério de aceite
- existe evidencia do GET sem sessao
- existe evidencia do POST de login admin
- existe evidencia do GET com sessao autenticada
- ou existe evidencia exata da falha, sem chute

---

## Fase C — Corrigir o menor delta restante

**Objetivo**: corrigir apenas o que estiver impedindo a autenticacao real.

### Regra
Se a Fase B falhar, nao abrir outra frente.
Corrigir somente o menor delta que bloquear o login.

### Exemplos validos de delta minimo
- csrf incorreto
- cookie nao persistido
- host incorreto
- tenant incorreto
- credencial admin incorreta
- estado auth/profile inconsistente
- sessao nao sendo gravada

### Exemplos invalidos de reacao
- reestruturar a aplicacao inteira
- reabrir automacao local
- mexer em deploy sem necessidade
- mexer em dominio
- iniciar limpeza final cedo demais

---

## Fase D — Repetir o smoke ate passar

**Objetivo**: confirmar que a correcao resolveu o problema de verdade.

### O que precisa acontecer
- repetir exatamente o mesmo smoke da Fase B
- comparar antes e depois
- registrar evidencia final de aprovacao

### Critério de aceite
- login admin funcional no dominio final
- sessao persistida e lida corretamente
- nenhuma contradicao entre operacao real e pasta `IMPLANTAR/`

---

## Fase E — Encerramento minimo funcional

**Objetivo**: declarar o sistema funcional no gratis.

### Condicoes para encerrar
- deploy valido em producao
- dominio principal respondendo
- login admin provado
- sessao admin provada
- sem P0 ou P1 abertos para o fluxo principal
- pasta `IMPLANTAR/` atualizada

### So depois disso
- decidir se vale limpar artefatos temporarios
- decidir se vale retomar automacao adicional
- decidir se vale preparar dominio pago

---

## 5. Definicao de 100 por cento funcional no gratis

Para este projeto, considerar "100 por cento funcional no gratis" como:

- aplicacao publicada
- tenant principal respondendo corretamente
- sessao admin funcionando
- autenticacao admin funcionando
- sem erro bloqueante visivel no fluxo principal
- operacao minima consistente

**Nao faz parte desta definicao agora**:
- dominio pago
- plano pago
- observabilidade premium
- automacao completa entre agentes
- robustez maxima de producao

---

## 6. Checklists objetivos

## Checklist de sincronizacao da pasta
- [ ] `ESTADO-ORQUESTRACAO.yaml` coerente com a realidade
- [ ] `STATUS-EXECUCAO.md` coerente com a realidade
- [ ] `CAIXA-DE-SAIDA.md` coerente com a realidade
- [ ] ultimo passo e proximo passo claramente escritos

## Checklist de smoke admin
- [ ] GET sem sessao registrado
- [ ] POST de login registrado
- [ ] GET com sessao registrado
- [ ] falha exata ou sucesso final registrado

## Checklist de encerramento
- [ ] deploy valido
- [ ] dominio valido
- [ ] login admin valido
- [ ] sem P0/P1 do fluxo principal

---

## 7. O que o executor deve fazer agora

O Executor nao deve tentar resolver o projeto inteiro nesta rodada.

Ele deve fazer somente isto:

### Rodada atual obrigatoria
**Fase A — sincronizar a pasta `IMPLANTAR/` com a realidade atual e abrir corretamente a Fase B como proximo passo oficial.**

### O que isso inclui
- atualizar o estado oficial
- registrar que ha deploy valido
- registrar que a automacao local foi fechada
- preparar oficialmente o passo de prova do login admin

### O que isso nao inclui
- nao mexer em banco
- nao mexer em deploy
- nao mexer em codigo de produto
- nao rodar ainda o login admin se isso nao for parte da rodada autorizada

---

## 8. Prompt de execucao recomendado para a rodada atual

Usar o prompt da secao final deste arquivo como instrucao do Executor.

---

## 9. Prompt pronto para o Executor

```text
Leia nesta ordem:
1. IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md
2. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
3. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
4. IMPLANTAR/00D-LIMPEZA-FINAL.md
5. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
6. IMPLANTAR/STATUS-EXECUCAO.md
7. IMPLANTAR/CAIXA-DE-ENTRADA.md
8. IMPLANTAR/CAIXA-DE-SAIDA.md
9. IMPLANTAR/02-PLANO-DE-FECHAMENTO-NO-GRATIS.md

Voce e o Agente Executor.

Sua tarefa nesta rodada e executar somente a Fase A do arquivo `IMPLANTAR/02-PLANO-DE-FECHAMENTO-NO-GRATIS.md`.

Objetivo:
- sincronizar a pasta `IMPLANTAR/` com a realidade atual do projeto
- registrar corretamente o que ja aconteceu
- deixar a Fase B aberta como proximo passo oficial

Voce deve:
1. revisar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
2. revisar `IMPLANTAR/STATUS-EXECUCAO.md`
3. revisar `IMPLANTAR/CAIXA-DE-ENTRADA.md`
4. revisar `IMPLANTAR/CAIXA-DE-SAIDA.md`
5. registrar que existe deploy valido em producao
6. registrar que a automacao local foi concluida como etapa anterior
7. abrir oficialmente a Fase B como proximo passo: provar autenticacao admin completa no dominio final
8. manter o historico sem apagar evidencias uteis
9. deixar o RETORNO CURTO padronizado no final

Nesta rodada, nao fazer:
- nao mexer em banco
- nao mexer em deploy
- nao mexer em codigo de produto
- nao abrir outra frente
- nao limpar arquivos ainda

Arquivos que voce pode alterar nesta rodada:
- IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
- IMPLANTAR/STATUS-EXECUCAO.md
- IMPLANTAR/CAIXA-DE-ENTRADA.md
- IMPLANTAR/CAIXA-DE-SAIDA.md

Criterio de aceite:
- a pasta `IMPLANTAR/` fica coerente com a realidade atual
- o proximo passo oficial fica claro
- o dono da vez fica claro
- o RETORNO CURTO padronizado existe

No final:
- mude o estado para `EXECUTOR_DONE_AWAITING_REVIEW`
- defina `current_owner` como `pensante`
- pare no final
```
