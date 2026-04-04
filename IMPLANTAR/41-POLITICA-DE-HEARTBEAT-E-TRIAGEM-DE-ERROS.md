# 41 — Política de heartbeat e triagem de erros

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Branch única: `main`

---

## 1. Objetivo

Esta política existe para impedir que a coordenação fique fria, desatualizada ou sem resposta por tempo demais.

Ela define:

- heartbeat obrigatório dos agentes
- janela máxima sem retorno
- formato de retorno curto
- regra de triagem de erro
- regra de escalonamento
- papel do orquestrador ao receber erros

---

## 2. Regra principal

### Regra de heartbeat
Todo agente ativo em uma tarefa deve enviar um retorno curto **a cada 5 minutos**.

Isso vale mesmo quando:
- ainda não concluiu o passo
- ainda está investigando
- ficou bloqueado
- depende de outro agente

Sem heartbeat, a tarefa entra em risco de abandono operacional.

---

## 3. O que cada heartbeat deve conter

Todo heartbeat deve seguir exatamente este formato:

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

Se não houver erro ativo, preencher:
- `Erro ativo: NAO`
- `Descricao do erro: N/A`
- `Impacto do erro: N/A`
- `Hipotese atual: N/A`

---

## 4. Regra de erro obrigatório

Se um agente encontrar erro, ele não pode só dizer “deu erro”.

Ele deve registrar no heartbeat:

1. onde o erro aconteceu
2. qual ação gerou o erro
3. evidência objetiva do erro
4. impacto operacional
5. hipótese mínima atual
6. se precisa de outro agente

---

## 5. O que o orquestrador deve fazer ao receber erro

Sempre que um agente registrar erro, o orquestrador deve:

1. ler o erro registrado
2. classificar o erro
3. separar FATO, SUPOSIÇÃO e [PENDENTE]
4. procurar solução para o erro ativo
5. dizer qual agente deve agir
6. registrar o próximo passo exato

O orquestrador não deve deixar erro “solto” sem dono e sem próximo passo.

---

## 6. Classificação obrigatória de erros

### E0 — erro informativo
Não bloqueia a frente.

### E1 — erro local
Bloqueia só um passo do agente atual.

### E2 — erro de integração
Bloqueia fluxo entre sistemas.

### E3 — erro estrutural
Bloqueia deploy, auth, pagamento, persistência ou operação crítica.

### E4 — erro de regressão
Algo que já funcionava e voltou a falhar.

---

## 7. Regras por tipo de erro

### E1
- o próprio agente tenta resolver
- se não resolver em 2 heartbeats, escalar

### E2
- envolver o agente certo do outro sistema
- registrar dependência cruzada

### E3
- prioridade máxima
- congelar frentes não essenciais
- definir dono único

### E4
- localizar qual mudança reabriu o problema
- registrar suspeita de regressão
- revisar rollback possível

---

## 8. Tempo máximo sem retorno

### Regra dura
Se um agente ficar **mais de 5 minutos** sem heartbeat durante tarefa ativa:
- o status passa para `SILENCIOSO`
- a tarefa entra em revisão do orquestrador
- pode haver redistribuição

### Regra de tolerância
Se houve erro crítico e o agente avisou que precisa de mais uma janela:
- tolerar mais 5 minutos
- exigir evidência no retorno seguinte

---

## 9. Regra de redistribuição

A tarefa pode ser redistribuída quando:

- não houve heartbeat no prazo
- houve 2 heartbeats seguidos sem avanço e sem hipótese nova
- o agente declarou limitação real
- o erro exige outro acesso

---

## 10. Regra do agente bloqueado

Agente bloqueado não some.

Ele deve continuar mandando heartbeat a cada 5 minutos até:
- ser destravado
- passar a tarefa
- entrar em rollback
- concluir a etapa

---

## 11. Regra de solução obrigatória

Sempre que houver erro ativo no `IMPLANTAR`, o orquestrador deve abrir uma trilha de solução com este formato:

```md
## TRIAGEM-[ID]

**Erro recebido de**:
**Classificacao**:
**FATO**:
**SUPOSICAO**:
**[PENDENTE]**:
**Impacto**:
**Solucao proposta**:
**Agente responsavel pela acao**:
**Critério de aceite**:
**Rollback**:
```

---

## 12. Regra para a pasta IMPLANTAR

Todo erro ativo deve existir em pelo menos um destes lugares:

- heartbeat do agente
- quadro de tarefas
- triagem do orquestrador
- status consolidado

Erro sem rastro em `IMPLANTAR` é erro invisível e não é permitido.

---

## 13. Regra prática para a operação atual

### Antigravity
- heartbeat a cada 5 min quando estiver em teste de UI
- sempre registrar URL, ação e resultado visual

### Agente de banco
- heartbeat a cada 5 min quando estiver em consulta ou validação
- sempre registrar tabela, tenant e efeito observado

### Agente de deploy
- heartbeat a cada 5 min durante deploy/log/validação
- sempre registrar deployment id, estado e domínio

### Agente de Stripe
- heartbeat a cada 5 min durante análise de onboarding/status
- sempre registrar conta, requisito e bloqueio

### Orquestrador
- revisar heartbeats recebidos
- responder com triagem e próximo passo
- manter a fila viva

---

## 14. Regra final

Nenhum agente ativo pode ficar sem retorno por mais de 5 minutos.  
Todo erro ativo deve receber triagem.  
Toda triagem deve apontar dono, solução e critério de aceite.
