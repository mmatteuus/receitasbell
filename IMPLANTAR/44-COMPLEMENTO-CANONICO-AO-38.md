# 44 — Complemento canônico ao 38

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Branch única: `main`

---

## 1. Objetivo

Este arquivo complementa o `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md` e formaliza as tarefas que já foram distribuídas nos arquivos `39`, `40` e `43`.

### Regra canônica temporária
Até o `38` ser atualizado diretamente, este arquivo vale como extensão oficial do quadro de tarefas.

---

## 2. Tarefas canônicas complementares

### TASK-BROWSER-001
**Título**: Prova visual do fluxo admin e Stripe Connect  
**Status**: LIVRE  
**Objetivo**: dizer o que realmente acontece no navegador hoje  
**Dono recomendado**: Antigravity  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
- `IMPLANTAR/41-POLITICA-DE-HEARTBEAT-E-TRIAGEM-DE-ERROS.md`

**Passos exatos**:
1. validar login admin
2. validar acesso à área de pagamentos
3. validar ação de Stripe Connect
4. validar redirect/callback, se existir
5. registrar heartbeat a cada 5 minutos
6. registrar qualquer erro com evidência objetiva

**Critério de aceite**:
- [ ] login admin testado
- [ ] rota visual de pagamentos acessada
- [ ] botão/ação de Stripe Connect testado
- [ ] erro ou sucesso descrito com evidência textual
- [ ] pelo menos um heartbeat registrado se a tarefa durar mais de 5 min

**Rollback**:
- voltar a tarefa para LIVRE e limpar lock incorreto

---

### TASK-DB-001
**Título**: Prova de persistência do tenant principal e Stripe Connect  
**Status**: LIVRE  
**Objetivo**: confirmar estado real das tabelas e do tenant principal  
**Dono recomendado**: agente com Supabase  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
- `IMPLANTAR/41-POLITICA-DE-HEARTBEAT-E-TRIAGEM-DE-ERROS.md`

**Passos exatos**:
1. validar tenant principal
2. validar host do tenant principal
3. validar estado de `stripe_connect_accounts`
4. registrar divergências entre banco e documentação
5. registrar heartbeat a cada 5 minutos
6. registrar qualquer erro com evidência objetiva

**Critério de aceite**:
- [ ] tenant principal confirmado
- [ ] host confirmado
- [ ] estado de `stripe_connect_accounts` confirmado
- [ ] divergências registradas
- [ ] pelo menos um heartbeat registrado se a tarefa durar mais de 5 min

**Rollback**:
- voltar a tarefa para LIVRE e limpar lock incorreto

---

### TASK-DEPLOY-001
**Título**: Prova do estado real da produção na Vercel  
**Status**: LIVRE  
**Objetivo**: confirmar deploy, domínio e divergência documental  
**Dono recomendado**: agente com Vercel  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
- `IMPLANTAR/41-POLITICA-DE-HEARTBEAT-E-TRIAGEM-DE-ERROS.md`

**Passos exatos**:
1. identificar deploy mais recente
2. validar status do deploy
3. validar domínio efetivo
4. registrar divergência entre estado real e pasta IMPLANTAR
5. registrar heartbeat a cada 5 minutos
6. registrar qualquer erro com evidência objetiva

**Critério de aceite**:
- [ ] deploy mais recente identificado
- [ ] status do deploy confirmado
- [ ] domínio efetivo confirmado
- [ ] divergência com `IMPLANTAR/` registrada
- [ ] pelo menos um heartbeat registrado se a tarefa durar mais de 5 min

**Rollback**:
- voltar a tarefa para LIVRE e limpar lock incorreto

---

### TASK-STRIPE-002
**Título**: Prova operacional do Stripe Connect  
**Status**: LIVRE  
**Objetivo**: validar o que depende da plataforma Stripe e o que depende do app  
**Dono recomendado**: agente com Stripe  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
- `IMPLANTAR/41-POLITICA-DE-HEARTBEAT-E-TRIAGEM-DE-ERROS.md`

**Passos exatos**:
1. validar conta da plataforma
2. validar requisitos do onboarding
3. registrar o que depende do app para Connect funcionar
4. registrar o que depende de navegador e o que depende de backend
5. registrar heartbeat a cada 5 minutos
6. registrar qualquer erro com evidência objetiva

**Critério de aceite**:
- [ ] conta da plataforma confirmada
- [ ] onboarding descrito
- [ ] dependências de backend registradas
- [ ] dependências de navegador registradas
- [ ] pelo menos um heartbeat registrado se a tarefa durar mais de 5 min

**Rollback**:
- voltar a tarefa para LIVRE e limpar lock incorreto

---

## 3. Template de heartbeat complementar

```md
### HEARTBEAT-[ID]

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

## 4. Regra final

Enquanto o `38` não for editado diretamente, os agentes devem considerar:
- `38` como quadro base
- `44` como complemento canônico oficial das tarefas distribuídas
