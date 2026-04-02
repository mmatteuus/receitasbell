# Regra Permanente — Toda Correção Deve Preservar a Aplicação

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Regra absoluta

A partir deste ponto, toda modificação, correção, ajuste, refatoração, limpeza, consolidação, hotfix ou evolução deve ser feita **sem quebrar a aplicação**.

Esta regra vale para:
- backend
- frontend
- rotas
- build
- deploy
- variáveis de ambiente
- integrações
- banco
- autenticação
- painel admin
- pagamentos
- webhook
- Vercel
- Supabase

---

## O que “sem quebrar a aplicação” significa

Nenhuma correção pode:
- derrubar login existente
- quebrar painel admin
- remover rota pública já usada
- trocar contrato de API sem compatibilidade
- invalidar sessão atual
- quebrar checkout existente
- quebrar deploy estável anterior sem rollback claro
- criar nova função serverless sem validar o orçamento do plano Hobby
- alterar fluxo crítico sem teste mínimo e evidência

---

## Regra operacional do Pensante

O Pensante deve sempre:

1. identificar o erro real
2. comparar contra o último estado `READY`
3. isolar a menor correção possível
4. prever efeitos colaterais antes da execução
5. bloquear qualquer mudança que aumente risco sem necessidade
6. preferir consolidação a criação de novas superfícies
7. exigir rollback explícito
8. exigir evidência de não-quebra

Se houver duas formas de corrigir, deve ser escolhida a que:
- muda menos arquivos
- muda menos contratos
- cria menos funções
- preserva mais comportamento existente

---

## Regra operacional do Executor

O Executor não pode aplicar correção por impulso.

Antes de alterar qualquer arquivo, ele deve registrar:
- qual erro real está corrigindo
- qual comportamento existente deve permanecer intacto
- qual é a menor alteração possível
- qual é o rollback
- qual é o risco residual

Se isso não estiver claro, a execução deve ser bloqueada e registrada em `IMPLANTAR/20`.

---

## Protocolo obrigatório de não-quebra

Toda mudança deve passar por este protocolo:

### Etapa 1 — Preservação do contrato
Confirmar que permanecem intactos, se aplicável:
- URL externa
- método HTTP
- formato de request
- formato de response
- autenticação/autorização
- nomes de variáveis de ambiente em uso
- comportamento do admin
- comportamento do checkout já existente

### Etapa 2 — Preservação do deploy
Confirmar antes do push:
- `npm run gate` passa
- não aumentou a contagem de funções acima do orçamento do plano
- não criou arquivo redundante em `/api`
- não removeu rewrite necessária
- não removeu handler crítico sem substituto equivalente

### Etapa 3 — Preservação da operação
Confirmar antes de encerrar:
- existe rollback simples
- existe evidência do que foi alterado
- existe registro do que não foi alterado de propósito
- existe nota de risco residual

---

## Regra especial para Vercel Hobby

Toda alteração em `/api` deve obedecer esta regra extra:

### Nunca criar nova função sem orçamento explícito
Antes de criar ou manter um novo arquivo em `/api`, o Executor deve provar:
- quantas funções já existem no estado atual
- quantas existiam no último deploy `READY`
- por que a nova função não excede o limite do plano

Se não puder provar isso, a alteração é proibida.

### Preferência obrigatória
A ordem correta é:
1. reutilizar função catch-all existente
2. consolidar rota em router interno
3. reaproveitar rewrite
4. só em último caso criar função nova

---

## Regra de previsão de erro

O Pensante deve antecipar e evitar pelo menos estes riscos antes de mandar executar:

### Riscos de deploy
- excesso de funções serverless
- env incompatível com schema
- build passando mas publicação falhando
- rota existente sendo sobrescrita por arquivo redundante

### Riscos de integração
- webhook separado criando função extra desnecessária
- refresh/return mudando URL do admin
- Stripe Connect sem persistência no banco
- retorno do Stripe sem reconsulta do status

### Riscos de segurança
- quebra de auth no admin
- sessão de tenant misturada
- body parser quebrando assinatura de webhook
- segredo faltando e só falhando em produção

### Riscos de regressão
- corrigir Stripe e quebrar checkout
- corrigir deploy e quebrar painel
- corrigir rota e quebrar rewrite
- remover arquivo sem validar o substituto efetivo

---

## Regra de decisão

Se a correção:
- muda contrato externo
- aumenta função serverless
- aumenta risco operacional
- mexe em auth
- mexe em webhook
- mexe em checkout

então ela só pode ser executada se houver:
- justificativa explícita
- rollback explícito
- evidência de equivalência funcional
- registro em `IMPLANTAR/19` ou `IMPLANTAR/20`

---

## Regra final de autoridade

De agora em diante:

**corrigir sem quebrar é obrigatório**  
**prever erro antes de executar é obrigatório**  
**reduzir superfície técnica é obrigatório**  
**preservar a aplicação é prioridade acima da velocidade**
