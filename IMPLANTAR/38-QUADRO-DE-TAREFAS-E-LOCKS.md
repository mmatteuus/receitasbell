# 38 — Quadro de tarefas e locks

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell

---

## 1. Objetivo

Este arquivo é o quadro único de:

- tarefas abertas
- dono atual
- lock ativo
- evidência entregue
- próximo passo

Sem registro aqui, a tarefa não existe operacionalmente.

---

## 2. Regras do quadro

### Regra 1 — uma tarefa, um dono
Cada tarefa só pode ter um dono ativo por vez.

### Regra 2 — sem lock, sem execução
O agente deve primeiro marcar a tarefa como `EM EXECUCAO`.

### Regra 3 — parar ao concluir um passo
Ao terminar, o agente muda para `AGUARDANDO VALIDACAO` ou `CONCLUIDA`.

### Regra 4 — não editar tarefa de outro agente
Só o orquestrador pode reatribuir.

### Regra 5 — toda tarefa tem rollback
Mesmo tarefa documental deve ter reversão simples.

---

## 3. Estados permitidos

- LIVRE
- EM EXECUCAO
- AGUARDANDO VALIDACAO
- CONCLUIDA
- BLOQUEADA
- ROLLBACK

---

## 4. Tarefas abertas

### TASK-AGENT-001
**Título**: Cadastro e revalidação de capacidades de todos os agentes  
**Status**: LIVRE  
**Objetivo**: descobrir quem são os agentes, o que cada um consegue fazer e quais limites reais possuem  
**Dono atual**: [LIVRE]  
**Arquivos-alvo**:
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`

**Passos exatos**:
1. cada agente responder o questionário obrigatório
2. registrar a resposta no cadastro
3. marcar o status do agente
4. informar qual tarefa ele pode pegar

**Critério de aceite**:
- [ ] agentes ativos cadastrados
- [ ] acessos reais declarados
- [ ] limites reais declarados
- [ ] próximo tipo de tarefa sugerido para cada agente

**Como validar**:
- existe uma seção por agente em `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`

**Rollback**:
- remover a seção incorreta e recriar com evidência melhor

---

### TASK-AGENT-002
**Título**: Distribuição inicial das frentes sem sobreposição  
**Status**: LIVRE  
**Objetivo**: alocar cada agente em uma frente única e compatível com sua capacidade  
**Dono atual**: [LIVRE]  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`

**Passos exatos**:
1. ler cadastro dos agentes
2. escolher uma frente por agente
3. evitar dois agentes no mesmo arquivo/alvo
4. registrar dono e estado

**Critério de aceite**:
- [ ] cada frente tem no máximo um dono
- [ ] nenhum agente está em tarefa incompatível
- [ ] há lock claro para cada item ativo

**Como validar**:
- quadro atualizado com dono e status

**Rollback**:
- remover atribuição incorreta e redistribuir

---

### TASK-STRIPE-001
**Título**: Validar fluxo real de Stripe Connect com agente certo  
**Status**: LIVRE  
**Objetivo**: separar claramente quem valida navegador, quem valida backend, quem valida persistência e quem valida Stripe  
**Dono atual**: [LIVRE]  
**Arquivos-alvo**:
- `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
- `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`

**Passos exatos**:
1. agente de navegador valida UI/redirect
2. agente de banco valida persistência
3. agente de Stripe valida conta/onboarding/status
4. orquestrador consolida a evidência

**Critério de aceite**:
- [ ] dono de cada subfrente definido
- [ ] sem duplicidade entre navegador, banco e Stripe
- [ ] evidência mínima definida por subfrente

**Rollback**:
- voltar a tarefa para LIVRE e redistribuir

---

## 5. Template de lock

Copiar e preencher sempre que uma tarefa for assumida:

```md
### LOCK-[ID]

**Tarefa**:
**Agente**:
**Status**: EM EXECUCAO
**Inicio**:
**Objetivo do passo**:
**Arquivos-alvo**:
**Risco**:
**Rollback**:
**Evidência esperada**:
```

---

## 6. Template de conclusão

```md
### RESULTADO-[ID]

**Tarefa**:
**Agente**:
**Status final**: AGUARDANDO VALIDACAO | CONCLUIDA | BLOQUEADA | ROLLBACK
**Feito**:
**Comandos executados**:
**Evidências**:
**Resultado real**:
**Próximo passo recomendado**:
```

---

## 7. Ordem inicial recomendada

### Frente 1
Cadastro de todos os agentes.

### Frente 2
Distribuição de tarefas compatíveis.

### Frente 3
Validação do fluxo Stripe Connect por subfrentes separadas.

### Frente 4
Atualização de status e limpeza apenas do que estiver realmente superado.

---

## 8. Regra final

O agente não escolhe duas frentes.  
O agente não se autoexpande de escopo.  
O agente trava, executa, prova e libera.
