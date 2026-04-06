# Protocolo de Coordenação de Agentes - Receitas Bell

**OBRIGATÓRIO:** Todos os agentes DEVEM seguir este protocolo.

---

## 🎯 OBJETIVO

Evitar que:
- 2 agentes façam a mesma tarefa
- Trabalho seja duplicado
- Conflitos de código aconteçam
- Tempo seja desperdiçado

---

## 📜 REGRAS OBRIGATÓRIAS

### REGRA 1: Ler o Task Tracker SEMPRE
**Antes de iniciar qualquer tarefa:**
```bash
cat IMPLANTAR/TASK-TRACKER.md
```

### REGRA 2: Verificar Status da Tarefa
- ✅ **CONCLUIDO** → Não fazer nada
- ⏳ **EM_PROGRESSO** → PARAR! Escolher outra tarefa
- 🚫 **BLOQUEADO** → Resolver bloqueio ou escolher outra
- 📝 **PENDENTE** → OK para pegar

### REGRA 3: Registrar IMEDIATAMENTE
**Ao pegar uma tarefa:**
1. Atualizar status para ⏳ EM_PROGRESSO
2. Adicionar seu nome
3. Adicionar timestamp
4. Commitar ANTES de começar o código

```bash
# Exemplo
git pull
# Editar TASK-TRACKER.md
git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 iniciada por AgenteSecurity"
git push
# Agora pode começar o código
```

### REGRA 4: Atualizar ao Concluir
**Ao terminar:**
1. Atualizar status para ✅ CONCLUIDO
2. Adicionar timestamp de conclusão
3. Adicionar link do commit/PR
4. Commitar

### REGRA 5: Comunicar Bloqueios
**Se bloquear:**
1. Atualizar status para 🚫 BLOQUEADO
2. Explicar o bloqueio
3. Marcar dependência
4. Escolher outra tarefa

---

## 🔄 FLUXO COMPLETO

### Passo 1: Escolher Tarefa
```bash
# 1. Atualizar repo
git pull origin main

# 2. Ler task tracker
cat IMPLANTAR/TASK-TRACKER.md

# 3. Buscar tarefas PENDENTE (📝)
grep "PENDENTE" IMPLANTAR/TASK-TRACKER.md

# 4. Escolher uma tarefa compatível com seu papel
# Agente Segurança → P0-1, P0-3, P0-5, P0-7
# Agente Resiliência → P0-2, P0-6, P1-1, P1-2
# etc.
```

### Passo 2: Verificar Dependências
```markdown
# Exemplo: P0-8 depende de P0-4
P0-8: Alertas
Dependências: P0-4 (SLO definido)

# Se P0-4 ainda não está CONCLUIDO:
# → NÃO pode pegar P0-8
# → Escolher outra tarefa
```

### Passo 3: Registrar Início
```bash
# Editar TASK-TRACKER.md
# Localizar a tarefa (ex: P0-1)
# Alterar:
# Status: 📝 PENDENTE
# PARA:
# Status: ⏳ EM_PROGRESSO
# Agente: AgenteSecurity
# Iniciado em: 2026-04-06 22:00

git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 iniciada por AgenteSecurity"
git push
```

### Passo 4: Executar Tarefa
```bash
# Agora pode começar o trabalho
# Seguir o código do dossiê
# Fazer commits parciais a cada 30min
```

### Passo 5: Registrar Conclusão
```bash
# Editar TASK-TRACKER.md
# Status: ⏳ EM_PROGRESSO
# PARA:
# Status: ✅ CONCLUIDO
# Concluído em: 2026-04-06 23:30
# Commit/PR: abc123f

git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 concluída"
git push
```

---

## ⚠️ CONFLITOS

### Cenário 1: Outro agente pegou entre pull e push
```bash
# Você fez pull, viu P0-1 PENDENTE
# Enquanto você editava, outro agente pegou P0-1
# Ao fazer push, vai dar conflito

# SOLUÇÃO:
git pull  # Vai mostrar conflito
cat IMPLANTAR/TASK-TRACKER.md  # Ver quem pegou
# Se outro agente registrou primeiro:
# → Descartar sua mudança
# → Escolher OUTRA tarefa PENDENTE
git checkout --theirs IMPLANTAR/TASK-TRACKER.md
git add IMPLANTAR/TASK-TRACKER.md
git commit -m "merge: aceitar task de outro agente"
```

### Cenário 2: Tarefa bloqueada
```markdown
# P0-8 depende de P0-4
# P0-4 ainda não foi feito

# SOLUÇÃO:
# 1. Marcar P0-8 como BLOQUEADO
# 2. Escolher outra tarefa (ex: P0-5)
# 3. Voltar para P0-8 quando P0-4 estiver CONCLUIDO
```

---

## 📋 TEMPLATE DE ATUALIZAÇÃO

### Ao Iniciar
```markdown
### P0-X: [Nome da Tarefa]
- **Status:** ⏳ EM_PROGRESSO
- **Agente:** [SEU_NOME]
- **Iniciado em:** [TIMESTAMP]
- **Estimativa:** [HORAS]h
```

### Durante Execução (opcional)
```markdown
### P0-X: [Nome da Tarefa]
- **Status:** ⏳ EM_PROGRESSO (50% completo)
- **Agente:** [SEU_NOME]
- **Iniciado em:** [TIMESTAMP]
- **Nota:** Encontrei [ISSUE]. Resolvendo...
```

### Ao Concluir
```markdown
### P0-X: [Nome da Tarefa]
- **Status:** ✅ CONCLUIDO
- **Agente:** [SEU_NOME]
- **Iniciado em:** [TIMESTAMP_INICIO]
- **Concluído em:** [TIMESTAMP_FIM]
- **Commit/PR:** [SHA ou #PR_NUMBER]
- **Testes:** ✅ Passando
```

### Se Bloquear
```markdown
### P0-X: [Nome da Tarefa]
- **Status:** 🚫 BLOQUEADO
- **Agente:** [SEU_NOME]
- **Bloqueado em:** [TIMESTAMP]
- **Motivo:** Depende de P0-Y que não está pronto
- **Ação:** Escolhendo outra tarefa
```

---

## 🎭 EXEMPLOS PRÁTICOS

### Exemplo 1: Agente Segurança pega P0-1

```bash
# 1. Pull
git pull

# 2. Ler tracker
cat IMPLANTAR/TASK-TRACKER.md
# Vê: P0-1 Status: PENDENTE

# 3. Editar
# Mudar P0-1 para EM_PROGRESSO
# Adicionar: Agente: AgenteSecurity
# Adicionar: Iniciado: 2026-04-06 22:00

# 4. Commit IMEDIATO
git add IMPLANTAR/TASK-TRACKER.md
git commit -m "task: P0-1 iniciada por AgenteSecurity"
git push

# 5. Começar código
# Seguir DOSSIE-COMPLETO-PARTE1.md seção P0-1
```

### Exemplo 2: Agente Resiliência tenta pegar P0-1 (conflito)

```bash
# 1. Pull (30s depois do Agente Segurança)
git pull

# 2. Ler tracker
cat IMPLANTAR/TASK-TRACKER.md
# Vê: P0-1 Status: EM_PROGRESSO
# Vê: Agente: AgenteSecurity

# 3. Decisão: PARAR! Não pegar P0-1
# 4. Escolher outra: P0-2 está PENDENTE
# 5. Pegar P0-2
```

### Exemplo 3: Agente Observabilidade tenta pegar P0-8 (bloqueio)

```bash
# 1. Ler tracker
cat IMPLANTAR/TASK-TRACKER.md

# 2. Ver P0-8
# Dependências: P0-4 (SLO definido)

# 3. Verificar P0-4
# Status: PENDENTE (ainda não foi feito!)

# 4. Decisão: Não pode pegar P0-8 ainda
# 5. Opção A: Fazer P0-4 primeiro
# 6. Opção B: Escolher outra tarefa (ex: P1-7)
```

---

## ✅ CHECKLIST DE COORDENAÇÃO

Antes de iniciar:
- [ ] `git pull`
- [ ] Ler `TASK-TRACKER.md`
- [ ] Verificar status da tarefa
- [ ] Verificar dependências
- [ ] Atualizar status para EM_PROGRESSO
- [ ] Adicionar nome e timestamp
- [ ] `git commit` e `git push` ANTES de código

Durante:
- [ ] Commits parciais a cada 30min
- [ ] Se bloquear > 2h, marcar BLOQUEADO

Ao concluir:
- [ ] Atualizar status para CONCLUIDO
- [ ] Adicionar timestamp de conclusão
- [ ] Adicionar link do commit
- [ ] `git push`

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
