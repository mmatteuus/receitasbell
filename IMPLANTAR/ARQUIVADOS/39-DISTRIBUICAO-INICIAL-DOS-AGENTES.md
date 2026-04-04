# 39 — Distribuição inicial dos agentes

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Branch única: `main`

---

## 1. Objetivo

Este arquivo define a primeira distribuição nominal das frentes para impedir:

- dois agentes na mesma frente
- agente sem capacidade assumindo tarefa crítica
- retrabalho entre navegador, banco, deploy e Stripe

---

## 2. FATO

### FATO 1
O único agente explicitamente citado com capacidade de navegador é o **Antigravity**.

### FATO 2
O orquestrador já consegue atuar em:
- repositório
- Vercel
- Supabase
- Stripe
- criação de artefatos de coordenação

### FATO 3
Ainda não existe cadastro confirmado de todos os demais agentes na execução atual.

---

## 3. SUPOSIÇÃO mínima e reversível

Até prova em contrário, a distribuição inicial deve assumir apenas estes papéis confirmados:

- **AGENTE-001 — Orquestrador/Pensante**
- **AGENTE-002 — Antigravity (Navegador)**
- **AGENTE-003+ — qualquer novo agente só entra após cadastro em `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`**

---

## 4. Distribuição inicial obrigatória

### AGENTE-001 — Orquestrador / Pensante
**Função**: coordenação central  
**Deve fazer agora**:
- manter `IMPLANTAR/36`, `37`, `38` e este arquivo coerentes
- validar evidências
- distribuir frentes
- consolidar fatos
- decidir prioridade
- autorizar limpeza de arquivos apenas após revalidação

**Não deve fazer agora**:
- validar UI pelo navegador
- declarar comportamento visual sem prova externa

**Tarefa inicial atribuída**:
- `TASK-AGENT-002` — distribuição inicial das frentes

---

### AGENTE-002 — Antigravity
**Função**: navegador e validação visual/real  
**Deve fazer agora**:
- se cadastrar no arquivo `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
- confirmar capacidades reais
- pegar a frente de navegador
- validar login admin
- validar fluxo visual de Stripe Connect
- validar redirects e callbacks quando solicitado

**Não deve fazer agora**:
- alterar contrato de backend sem instrução explícita
- mexer em banco sem tarefa específica
- assumir Vercel/Stripe/Supabase se não estiver cadastrado para isso

**Tarefa inicial atribuída**:
- `TASK-BROWSER-001` — descoberta e prova visual do fluxo admin + Stripe Connect

---

### AGENTE-003 — próximo agente com acesso a banco
**Função esperada**: Supabase / persistência  
**Condição para entrar**:
- precisa se cadastrar primeiro
- precisa provar acesso ao Supabase

**Deve fazer agora, se existir**:
- pegar a frente de persistência
- validar `stripe_connect_accounts`
- validar tabela/tenant/host
- registrar evidência objetiva

**Tarefa inicial sugerida**:
- `TASK-DB-001` — prova de persistência e consistência do tenant principal

---

### AGENTE-004 — próximo agente com acesso a deploy
**Função esperada**: Vercel / domínio / env  
**Condição para entrar**:
- precisa se cadastrar primeiro
- precisa provar acesso à Vercel

**Deve fazer agora, se existir**:
- validar deploy mais recente
- validar domínio efetivo
- validar estado atual do projeto
- registrar divergência entre documentação e estado real

**Tarefa inicial sugerida**:
- `TASK-DEPLOY-001` — prova do estado real de produção

---

### AGENTE-005 — próximo agente com acesso a Stripe
**Função esperada**: Stripe / onboarding / conta conectada  
**Condição para entrar**:
- precisa se cadastrar primeiro
- precisa provar acesso à Stripe

**Deve fazer agora, se existir**:
- validar conta de plataforma
- validar onboarding de Connect
- validar diferença entre status visual e status de API
- registrar o que depende de navegador e o que depende de backend

**Tarefa inicial sugerida**:
- `TASK-STRIPE-002` — prova operacional do onboarding e status de Connect

---

## 5. Primeira onda de execução

### Onda 1 — descoberta obrigatória
1. todos os agentes se cadastram no `IMPLANTAR/37`
2. todos os agentes declaram capacidades reais
3. o orquestrador atualiza o quadro `IMPLANTAR/38`

### Onda 2 — separação das frentes
1. navegador
2. deploy
3. banco
4. Stripe
5. repositório

### Onda 3 — consolidação
1. o orquestrador cruza as evidências
2. decide o próximo P0
3. só então libera execução corretiva

---

## 6. Tarefas iniciais recomendadas

### TASK-BROWSER-001
**Título**: Prova visual do fluxo admin e Stripe Connect  
**Dono recomendado**: Antigravity  
**Objetivo**: dizer o que realmente acontece no navegador hoje  
**Critério de aceite**:
- [ ] login admin testado
- [ ] rota visual de pagamentos acessada
- [ ] botão/ação de Stripe Connect testado
- [ ] erro ou sucesso descrito com evidência textual

---

### TASK-DB-001
**Título**: Prova de persistência do tenant principal e Stripe Connect  
**Dono recomendado**: agente com Supabase  
**Objetivo**: confirmar estado real das tabelas e do tenant principal  
**Critério de aceite**:
- [ ] tenant principal confirmado
- [ ] host confirmado
- [ ] estado de `stripe_connect_accounts` confirmado
- [ ] divergências registradas

---

### TASK-DEPLOY-001
**Título**: Prova do estado real da produção na Vercel  
**Dono recomendado**: agente com Vercel  
**Objetivo**: confirmar deploy, domínio e divergência documental  
**Critério de aceite**:
- [ ] deploy mais recente identificado
- [ ] status do deploy confirmado
- [ ] domínio efetivo confirmado
- [ ] divergência com `IMPLANTAR/` registrada

---

### TASK-STRIPE-002
**Título**: Prova operacional do Stripe Connect  
**Dono recomendado**: agente com Stripe  
**Objetivo**: validar o que depende da plataforma Stripe e o que depende do app  
**Critério de aceite**:
- [ ] conta da plataforma confirmada
- [ ] onboarding descrito
- [ ] dependências de backend registradas
- [ ] dependências de navegador registradas

---

## 7. Pergunta obrigatória para cada agente agora

Cada agente deve responder no cadastro:

1. Quem sou eu?
2. Qual meu nome operacional?
3. O que consigo fazer de verdade?
4. O que não consigo fazer?
5. Qual das tarefas acima eu posso pegar agora?
6. Que evidência consigo entregar ao final?

---

## 8. Regra final

Até todos os agentes se cadastrarem, a execução fica limitada a:

- orquestração
- leitura de estado
- distribuição de frente
- validação do que já é comprovável

Correção profunda só começa depois da rodada de descoberta.
