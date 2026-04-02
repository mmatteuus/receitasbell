# Validacao visual e correcao de imagens

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Adicionar ao planejamento oficial uma etapa explicita de validacao visual do sistema usando navegador real.

Esta etapa existe porque:

- o Agente Executor consegue acessar o navegador
- o Agente Executor consegue clicar em campos, botoes e navegar pelas telas
- existem relatos de imagens quebradas
- isso precisa entrar no plano, mas sem atropelar o fechamento do fluxo principal

---

## 2. Regra de prioridade

### FATO
O fluxo principal ainda precisa ser fechado primeiro:
- estado oficial da pasta `IMPLANTAR/`
- login admin completo
- sessao admin completa
- menor delta restante do fluxo principal

### REGRA
A validacao visual com navegador e a correcao de imagens quebradas devem acontecer **depois que o fluxo principal estiver funcional**, salvo se uma imagem quebrada bloquear diretamente uma acao critica de uso.

---

## 3. O que entra nesta etapa

Quando esta etapa for aberta oficialmente, o Executor deve usar o navegador para:

1. abrir o dominio final publicado
2. navegar pelas telas principais
3. clicar nos campos e botoes relevantes
4. verificar se os componentes carregam corretamente
5. verificar se ha imagens quebradas
6. verificar se ha falhas de layout que bloqueiem uso real
7. registrar em quais telas o erro aparece
8. registrar se o problema e de URL, asset ausente, permissao, build ou path incorreto

---

## 4. O que conta como imagem quebrada

Qualquer um dos casos abaixo:

- placeholder vazio no lugar da imagem
- icone quebrado do navegador
- erro 404/403 no asset
- componente com src invalido
- imagem que nao carrega em producao mas carrega localmente
- imagem dependente de URL errada, dominio antigo, bucket ausente ou permissao incorreta

---

## 5. Ordem obrigatoria

A etapa visual so deve ser aberta oficialmente quando estas condicoes forem verdadeiras:

- deploy valido em producao
- dominio principal respondendo
- login admin validado
- sessao admin validada
- sem P0 aberto no fluxo principal

Se essas condicoes ainda nao estiverem prontas, registrar apenas como pendencia planejada.

---

## 6. Fase visual planejada

### Nome oficial da fase
**Fase F — validacao visual com navegador e correcao de imagens quebradas**

### Objetivo
Garantir que a aplicacao esteja funcional tambem no nivel visual e de interacao real.

### Passos obrigatorios da Fase F
1. abrir a home publicada
2. abrir tela admin relevante
3. abrir fluxos principais do usuario
4. clicar nos botoes e campos criticos
5. identificar imagens quebradas
6. registrar evidencias por tela
7. corrigir o menor delta por vez
8. repetir validacao visual ate passar

### Critério de aceite
- nao ha imagens quebradas nas telas principais
- nao ha botao critico inutilizavel por falha visual
- nao ha campo critico inutilizavel por erro visual
- as telas principais estao navegaveis no navegador real

---

## 7. Causas provaveis para investigar quando a fase abrir

O Executor deve considerar estes grupos de causa:

### Grupo A — caminho de asset
- path relativo incorreto
- asset nao incluido no build
- import quebrado
- nome de arquivo divergente entre ambientes

### Grupo B — dominio/base URL
- imagem apontando para dominio antigo
- base path incorreto em producao
- host dinamico resolvendo errado

### Grupo C — storage/permissao
- bucket inexistente
- objeto ausente
- URL assinada expirada
- asset privado sem autorizacao adequada
- politica impedindo leitura

### Grupo D — componente
- fallback ausente
- estado nulo nao tratado
- src vazio
- renderizacao condicional com bug

---

## 8. Evidencias obrigatorias da fase visual

Quando a Fase F for executada, registrar:

- URL da tela testada
- acao feita no navegador
- resultado visual observado
- lista de imagens quebradas
- status HTTP do asset quando possivel
- causa provavel
- menor correcao proposta

---

## 9. Regra de correcao

Se houver imagens quebradas, corrigir **uma classe de problema por vez**.

### Correto
- corrigir path errado de um grupo de telas
- corrigir bucket/permissao especifico
- corrigir componente com fallback

### Incorreto
- reescrever toda a camada visual sem evidencias
- misturar correcao visual com auth, deploy e banco na mesma rodada

---

## 10. Instrucao final

A partir deste arquivo, considerar oficialmente que:

- o Executor pode usar navegador real
- o Executor pode clicar em campos e botoes
- a validacao visual e a correcao de imagens quebradas fazem parte do plano
- essa fase deve acontecer no momento certo, sem interromper o fechamento do fluxo principal
