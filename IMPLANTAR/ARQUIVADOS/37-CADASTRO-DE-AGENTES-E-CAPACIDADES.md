# 37 — Cadastro de agentes e capacidades

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

Projeto: Receitas Bell

---

## 1. Objetivo

Este arquivo é o cadastro canônico dos agentes ativos.

Todo agente que entrar na execução deve preencher uma seção nova abaixo antes de trabalhar.

---

## 2. Resumo operacional

### Agentes já conhecidos

#### AGENTE-001
**Nome operacional**: Orquestrador / Pensante  
**Função principal**: distribuir trabalho, validar evidência, definir sequência, evitar retrabalho  
**Acessos confirmados**:
- navegador: NÃO
- repositório: SIM
- commit/push: SIM
- Vercel: SIM
- Supabase: SIM
- Stripe: SIM
- testes locais: NÃO confirmado

**Consegue executar**:
- criar e atualizar documentos de processo
- inspecionar Vercel
- inspecionar Supabase
- inspecionar Stripe
- definir tarefas e critérios de aceite

**Não consegue executar**:
- validar interface pelo navegador diretamente
- assumir prova visual real sem um agente de navegador

**Deve pegar tarefas de**:
- orquestração
- análise
- priorização
- validação por evidência

**Não deve pegar tarefas de**:
- clique manual em UI
- prova visual de fluxo no navegador

**Evidência mínima que entrega**:
- status de serviço
- diffs
- leitura de banco
- estado de deploy
- contrato e instrução operacional

**Status**: ATIVO

#### AGENTE-002
**Nome operacional**: Antigravity  
**Função principal**: navegador e validação de fluxos reais  
**Acessos confirmados**:
- navegador: SIM
- repositório: NÃO confirmado
- commit/push: SIM (informado pelo operador humano, revalidar)
- Vercel: NÃO confirmado
- Supabase: NÃO confirmado
- Stripe: NÃO confirmado
- testes locais: NÃO confirmado

**Consegue executar**:
- acessar páginas
- testar login
- seguir redirects
- validar fluxo visual
- reportar resultado observado

**Não consegue executar**:
- ainda [PENDENTE] revalidar o que além do navegador ele consegue fazer com segurança

**Deve pegar tarefas de**:
- smoke visual
- validação de login
- validação de onboarding
- validação de callback

**Não deve pegar tarefas de**:
- decisão de arquitetura
- alteração de contrato sem instrução

**Evidência mínima que entrega**:
- URL testada
- status observado
- comportamento visual
- mensagens de erro vistas

**Status**: AGUARDANDO REVALIDACAO

---

## 3. Template para novos agentes

Copiar e preencher sem alterar o formato:

```md
## AGENTE-XXX

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
- status HTTP
- URL
- print textual

**Status**: ATIVO | BLOQUEADO | OCIOSO | AGUARDANDO REVALIDACAO
```

---

## 4. Perguntas obrigatórias para cadastro

Cada agente deve responder exatamente isso:

1. Qual seu nome operacional?
2. Você consegue usar navegador?
3. Você consegue editar o repositório?
4. Você consegue fazer commit e push?
5. Você consegue consultar Vercel?
6. Você consegue consultar Supabase?
7. Você consegue consultar Stripe?
8. Você consegue rodar testes locais?
9. Que tipos de tarefa você consegue executar sem ajuda?
10. Que tipos de tarefa você não consegue executar?
11. Que evidência você sempre consegue entregar?
12. Qual tarefa você quer pegar agora?

---

## 5. Regra de atualização

Sempre que um agente ganhar ou perder capacidade, atualizar este arquivo antes da próxima tarefa.

Exemplos:
- ganhou acesso a push
- perdeu acesso a Vercel
- não consegue mais testar navegador
- passou a rodar testes locais

---

## 6. Regra de confiança

Capacidade só é considerada confirmada quando houver prova real.

### Exemplo de prova aceitável
- abriu página real
- executou push real
- leu deploy real
- leu tabela real
- retornou status real da Stripe

### Não é prova aceitável
- “acho que consigo”
- “deve funcionar”
- “provavelmente tenho acesso”

---

## 7. Próxima ação obrigatória

Todo agente novo deve:

1. se cadastrar aqui
2. pegar uma tarefa em `IMPLANTAR/38-QUADRO-DE-TAREFAS-E-LOCKS.md`
3. registrar lock
4. executar apenas um passo
