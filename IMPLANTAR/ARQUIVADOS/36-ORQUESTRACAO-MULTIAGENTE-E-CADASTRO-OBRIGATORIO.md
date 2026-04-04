# 36 — Orquestração multiagente e cadastro obrigatório

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell  
Branch única: `main`

---

## 1. Objetivo

Este arquivo define a regra única de coordenação entre agentes para evitar:

- trabalho duplicado
- alteração concorrente no mesmo alvo
- agente executando sem declarar capacidade real
- correção sem evidência
- limpeza prematura de arquivos úteis
- push sem validação mínima

Este arquivo passa a valer como protocolo operacional para toda atuação na pasta `IMPLANTAR/`.

---

## 2. Regra de ouro

Nenhum agente pode começar uma tarefa antes de:

1. se identificar
2. declarar o que consegue fazer de verdade
3. declarar o que não consegue fazer
4. registrar o alvo que vai pegar
5. adquirir o lock da tarefa

Sem isso, a tarefa é inválida.

---

## 3. Papéis obrigatórios

### 3.1 Orquestrador
Responsável por:
- distribuir frentes
- evitar sobreposição
- validar se o agente certo está na tarefa certa
- exigir evidência objetiva
- decidir sequência de execução
- decidir quando um item pode ser arquivado/removido

### 3.2 Pensante
Responsável por:
- analisar
- separar FATO, SUPOSIÇÃO e [PENDENTE]
- decidir arquitetura e prioridade
- definir passo exato para o executor
- aprovar ou reprovar evidência

### 3.3 Executor
Responsável por:
- editar arquivo
- rodar comando
- validar output
- registrar evidência
- parar após concluir um passo

### 3.4 Agente de Navegador
Responsável por:
- validar UI real
- validar login
- clicar em fluxos protegidos
- testar redirect externo
- capturar evidência visual/textual
- informar o resultado do comportamento em produção

### 3.5 Agente de Infra/Deploy
Responsável por:
- Vercel
- variáveis de ambiente
- estado de deploy
- domínio
- logs de deploy
- rollback de deploy

### 3.6 Agente de Banco
Responsável por:
- Supabase
- schema
- leitura de tabela
- migração
- consistência de dados
- prova de persistência

### 3.7 Agente de Pagamentos
Responsável por:
- Stripe
- onboarding
- webhook
- status de conta conectada
- validação do fluxo de pagamentos

### 3.8 Agente de Repositório
Responsável por:
- criar/editar arquivos do repositório
- commit e push
- comparar commits
- registrar diffs

---

## 4. Regra de distribuição de trabalho

### Uma frente por agente
Cada agente pode segurar apenas:
- 1 tarefa principal em execução
- 1 tarefa secundária em espera

### Proibido
Nenhum agente pode:
- pegar duas tarefas no mesmo subsistema ao mesmo tempo
- editar o mesmo arquivo que outro agente já travou
- fazer push sem registrar evidência
- mudar objetivo da tarefa por conta própria
- declarar sucesso sem prova verificável

---

## 5. Ordem obrigatória de operação

1. Ler este arquivo
2. Ler `IMPLANTAR/37-CADASTRO-DE-AGENTES-E-CAPACIDADES.md`
3. Ler `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
4. Registrar identidade e capacidades
5. Pegar uma tarefa livre
6. Travar a tarefa
7. Executar apenas a tarefa travada
8. Registrar evidência
9. Liberar a tarefa
10. Aguardar nova atribuição

---

## 6. Perguntas obrigatórias que cada agente deve responder

Todo agente deve responder, sem pular item:

1. **Quem sou eu?**
2. **Qual meu nome operacional?**
3. **Quais sistemas consigo acessar?**
4. **Consigo usar navegador?**
5. **Consigo editar arquivos do repositório?**
6. **Consigo fazer commit e push?**
7. **Consigo consultar Vercel?**
8. **Consigo consultar Supabase?**
9. **Consigo consultar Stripe?**
10. **Consigo rodar testes locais?**
11. **Consigo alterar variáveis de ambiente?**
12. **Quais limites eu tenho?**
13. **Qual tipo de tarefa eu devo pegar?**
14. **Qual tipo de tarefa eu não devo pegar?**
15. **Qual minha evidência mínima de conclusão?**

---

## 7. Formato obrigatório de resposta de cada agente

```md
## AGENTE-[ID]

**Nome operacional**:
**Função principal**:
**Acessos confirmados**:
- navegador: SIM | NÃO
- repositório: SIM | NÃO
- commit/push: SIM | NÃO
- Vercel: SIM | NÃO
- Supabase: SIM | NÃO
- Stripe: SIM | NÃO
- testes locais: SIM | NÃO

**Consegue executar**:
- item 1
- item 2
- item 3

**Não consegue executar**:
- item 1
- item 2

**Deve pegar tarefas de**:
- tipo A
- tipo B

**Não deve pegar tarefas de**:
- tipo X
- tipo Y

**Evidência mínima que entrega**:
- comando
- output
- URL
- status HTTP
- print textual

**Status**: ATIVO | BLOQUEADO | OCIOSO
```

Sem esse formato o agente não está cadastrado.

---

## 8. Regra de lock

Toda tarefa deve ter:

- um dono
- um horário de início
- um alvo claro
- um rollback claro
- um estado

Estados permitidos:
- LIVRE
- EM EXECUCAO
- AGUARDANDO VALIDACAO
- BLOQUEADA
- CONCLUIDA
- ROLLBACK

---

## 9. Regra de não sobreposição

Se dois agentes puderem fazer a mesma coisa:

1. vence o agente já travado na tarefa
2. o outro agente deve escolher outra frente
3. se a tarefa for crítica, o segundo agente só entra como validador

---

## 10. Frentes recomendadas por especialidade

### Navegador
- login admin
- fluxo Stripe Connect
- callback/redirect
- prova visual

### Infra/Deploy
- Vercel
- domínio
- env
- logs
- deploy status

### Banco
- leitura e confirmação de tabela
- prova de persistência
- schema e migration

### Pagamentos
- criação de conta conectada
- onboarding-link
- webhooks
- reconciliação

### Repositório
- criação de arquivos de processo
- ajustes de contrato
- commit/push
- atualização de status

---

## 11. Critério para arquivar ou remover arquivos da pasta IMPLANTAR

Um arquivo só pode ser movido, arquivado ou removido quando:

- o fato descrito nele foi revalidado
- o próximo estado já está registrado em arquivo mais novo
- não existe dependência operacional ativa nele
- o orquestrador marcou o arquivo como `SUPERADO`
- o conteúdo útil já foi consolidado em documento canônico

Sem isso, não remover.

---

## 12. Protocolo de fechamento de uma tarefa

Toda tarefa encerrada precisa registrar:

```md
**Feito**:
**FATO validado**:
**Arquivos tocados**:
**Comandos executados**:
**Evidências**:
**Resultado real**:
**Risco residual**:
**Próximo passo recomendado**:
```

---

## 13. Regra permanente

Antes de qualquer execução, cada agente deve responder quem é, o que faz, o que não faz e qual tarefa vai pegar.  
Sem cadastro, sem lock, sem execução.
