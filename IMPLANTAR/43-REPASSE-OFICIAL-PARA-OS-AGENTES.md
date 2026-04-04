# 43 — Repasse oficial para os agentes

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Branch única: `main`

---

## 1. Objetivo

Este arquivo é o repasse operacional oficial para os agentes.

Ele existe para dizer, sem ambiguidade:
- quem deve fazer o quê
- em que ordem
- como registrar trabalho
- como reportar erro
- como manter a operação viva com heartbeat de 5 minutos

---

## 2. Leitura obrigatória para qualquer agente

Antes de fazer qualquer coisa, todo agente deve ler nesta ordem:

1. `IMPLANTAR/36-ORQUESTRACAO-MULTIAGENTE-E-CADASTRO-OBRIGATORIO.md`
2. `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
3. `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
4. `IMPLANTAR/39-DISTRIBUICAO-INICIAL-DOS-AGENTES.md`
5. `IMPLANTAR/40-PROMPTS-PRONTOS-PARA-CADA-AGENTE.md`
6. `IMPLANTAR/41-POLITICA-DE-HEARTBEAT-E-TRIAGEM-DE-ERROS.md`
7. `IMPLANTAR/42-REVISAO-ORQUESTRACAO.md`
8. este arquivo

Sem essa leitura, a execução é inválida.

---

## 3. Regra obrigatória antes de executar

Todo agente deve:

1. se cadastrar no `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
2. declarar capacidades reais e limites reais
3. escolher apenas uma tarefa
4. registrar lock no `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
5. enviar heartbeat a cada 5 minutos
6. registrar erro com evidência quando houver falha

Sem cadastro, sem lock e sem heartbeat, a tarefa não vale.

---

## 4. Onda 1 — tarefas que devem começar agora

### AGENTE-001 — Orquestrador / Pensante
**Você deve fazer agora**:
- manter coerência entre `36`, `37`, `38`, `39`, `40`, `41`, `42` e este arquivo
- revisar heartbeats recebidos
- triar erros ativos
- separar FATO, SUPOSIÇÃO e [PENDENTE]
- apontar solução e dono para cada erro ativo
- impedir sobreposição entre agentes

**Você não deve fazer agora**:
- declarar prova visual sem um agente de navegador
- abrir frente paralela sem evidência

**Entrega mínima**:
- triagem objetiva
- próximo passo exato
- dono definido
- critério de aceite

---

### AGENTE-002 — Antigravity / Navegador
**Você deve fazer agora**:
- se cadastrar no `37`
- pegar a frente de navegador
- registrar lock no `38`
- validar:
  - login admin
  - acesso à área de pagamentos
  - fluxo visual de Stripe Connect
  - redirect/callback, se aparecer
- enviar heartbeat a cada 5 minutos

**Você não deve fazer agora**:
- alterar contrato de backend
- mexer em banco
- assumir deploy/Stripe/Supabase sem cadastro compatível

**Entrega mínima**:
- URL testada
- ação executada
- resultado visual real
- mensagem de erro ou sucesso
- próximo passo sugerido

---

### AGENTE-003 — Banco / Supabase (se existir)
**Você deve fazer agora**:
- se cadastrar no `37`
- provar acesso real ao Supabase
- registrar lock no `38`
- validar:
  - tenant principal
  - host do tenant principal
  - estado de `stripe_connect_accounts`
  - divergências entre documentação e banco
- enviar heartbeat a cada 5 minutos

**Você não deve fazer agora**:
- mexer em deploy
- validar UI
- mudar schema sem instrução explícita

**Entrega mínima**:
- consulta executada
- resultado real
- tenant afetado
- inconsistência encontrada
- risco residual

---

### AGENTE-004 — Deploy / Vercel (se existir)
**Você deve fazer agora**:
- se cadastrar no `37`
- provar acesso real à Vercel
- registrar lock no `38`
- validar:
  - deploy mais recente
  - status do deploy
  - domínio efetivo
  - divergência entre estado real e `IMPLANTAR`
- enviar heartbeat a cada 5 minutos

**Você não deve fazer agora**:
- mexer em banco
- validar UI no lugar do agente de navegador
- assumir Stripe sem cadastro compatível

**Entrega mínima**:
- deployment id
- status
- domínio
- divergência registrada
- risco residual

---

### AGENTE-005 — Stripe / Pagamentos (se existir)
**Você deve fazer agora**:
- se cadastrar no `37`
- provar acesso real à Stripe
- registrar lock no `38`
- validar:
  - conta da plataforma
  - requisitos do onboarding
  - o que depende do app para Connect funcionar
  - o que depende de navegador e o que depende de backend
- enviar heartbeat a cada 5 minutos

**Você não deve fazer agora**:
- fazer prova visual no lugar do agente de navegador
- alterar banco sem instrução explícita

**Entrega mínima**:
- conta confirmada
- requisito pendente
- dependência técnica
- bloqueio atual
- próximo passo sugerido

---

## 5. Tarefas formais a serem assumidas

### TASK-BROWSER-001
**Título**: Prova visual do fluxo admin e Stripe Connect  
**Dono recomendado**: Antigravity  
**Objetivo**: dizer o que realmente acontece no navegador hoje

### TASK-DB-001
**Título**: Prova de persistência do tenant principal e Stripe Connect  
**Dono recomendado**: agente com Supabase  
**Objetivo**: confirmar estado real das tabelas e do tenant principal

### TASK-DEPLOY-001
**Título**: Prova do estado real da produção na Vercel  
**Dono recomendado**: agente com Vercel  
**Objetivo**: confirmar deploy, domínio e divergência documental

### TASK-STRIPE-002
**Título**: Prova operacional do Stripe Connect  
**Dono recomendado**: agente com Stripe  
**Objetivo**: validar o que depende da plataforma Stripe e o que depende do app

---

## 6. Formato obrigatório de heartbeat

Todo agente ativo deve registrar a cada 5 minutos:

```md
## HEARTBEAT-[ID]

**Agente**:
**Tarefa**:
**Status**: EM EXECUCAO | BLOQUEADO | AGUARDANDO VALIDACAO
**Feito desde o ultimo heartbeat**:
**Evidencia objetiva**:
**Erro ativo**: SIM | NAO
**Descricao do erro**:
**Impacto do erro**:
**Hipotese atual**:
**Precisa de outro agente**: SIM | NAO
**Qual agente precisa**:
**Proximo passo em 5 min**:
```

---

## 7. Regra de erro

Se um agente achar erro, deve registrar:
- onde aconteceu
- qual ação gerou o erro
- evidência objetiva
- impacto operacional
- hipótese atual
- se precisa de outro agente

Erro sem evidência não vale como bloqueio formal.

---

## 8. Regra de prioridade

### Prioridade máxima
1. deploy quebrado
2. auth quebrado
3. Stripe Connect bloqueado
4. persistência inconsistente
5. documentação divergente do estado real

### Prioridade secundária
1. organização do barramento
2. limpeza de arquivos superados
3. melhoria de processo

---

## 9. Regra de não sobreposição

Nenhum agente pode:
- pegar duas frentes
- editar o mesmo alvo já travado por outro agente
- assumir tarefa incompatível com sua capacidade real
- declarar sucesso sem evidência

---

## 10. Mensagem curta para qualquer agente

```text
Leia os arquivos 36, 37, 38, 39, 40, 41, 42 e 43.
Cadastre-se no 37.
Escolha apenas uma tarefa.
Registre lock no 38.
Envie heartbeat a cada 5 minutos.
Se houver erro, registre evidência e hipótese.
Pare após concluir um passo.
```

---

## 11. Regra final

A operação agora está oficialmente repassada.

O próximo passo dos agentes é:
1. cadastro real
2. lock real
3. heartbeat real
4. evidência real
5. triagem do orquestrador
