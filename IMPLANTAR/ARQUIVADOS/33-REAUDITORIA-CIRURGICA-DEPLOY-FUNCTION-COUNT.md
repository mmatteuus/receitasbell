# 33 — Reauditoria cirúrgica do deploy Vercel: function count

Status: ATUAL E VALIDO
Escopo: destravar deploy de produção sem abrir frente nova
Branch: `main`
Projeto: `mmatteuus/receitasbell`

---

## 1. Resultado da reauditoria

### FATO
A auditoria anterior que apontava `eslint: command not found` como erro dominante está SUPERADA pelo último deploy real.

### FATO
O último deploy auditado agora é:
- `dpl_BLRZcQvcoeiBNkGsYa8FAtoj3UJ8`
- commit: `0a7993bf82bf1129e7a811eec40dba21271771a5`

### FATO
Esse deploy executou com sucesso:
- `npm install`
- `npm run gate`
- lint
- typecheck
- build
- testes
- geração do output

### FATO
A falha atual real ocorre apenas no final, em `Deploying outputs...`, com:

```txt
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

### Conclusão operacional
O problema dominante voltou a ser exatamente o orçamento de funções serverless da Vercel Hobby.

---

## 2. Correção da minha própria auditoria anterior

### FATO
A hipótese anterior de que o deploy estava travando primeiro em `eslint` não se sustenta mais como diagnóstico atual.

### Interpretação correta
Houve ou leitura parcial anterior, ou estado transitório anterior já superado.

### Regra a partir daqui
Não tratar mais `eslint` como bloqueio principal enquanto o último deploy auditado continuar mostrando:
- gate passando
- build completando
- erro apenas no publish por function count

---

## 3. Estado real atual do código de pagamentos

### FATO
O catch-all de pagamentos já está com `bodyParser: false`:
- `api/payments/[...path].ts`

### FATO
O helper HTTP já possui fallback de leitura do stream bruto:
- `src/server/shared/http.ts`

### FATO
O checkout session já usa `readJsonBody(...)`:
- `src/server/payments/application/handlers/checkout/session.ts`

### FATO
O router de pagamentos já aceita:
- `/api/payments/webhooks/stripe`
- `/api/payments/webhook`

### FATO
O arquivo dedicado `api/payments/webhook.ts` NÃO existe mais na `main`.

### Conclusão operacional
A cirurgia inicialmente prevista para absorver o webhook no catch-all JÁ ESTÁ aplicada na `main`.

Logo:
- insistir de novo nessa cirurgia agora seria retrabalho
- o excedente de função está em outro ponto

---

## 4. Hipótese corrigida: o excedente não é mais o webhook

### FATO
O deploy READY conhecido `dpl_AwYhRqudtpEbRDAh6zEQZAAa5G4x` registrou:

```json
{"nodejs":12}
```

### FATO
O deploy atual falha dizendo que ultrapassou o limite de 12.

### Interpretação técnica
Existe alta chance de haver 13ª função efetiva no output atual, ou um conjunto de entradas `/api` que a Vercel esteja materializando acima do orçamento disponível.

---

## 5. Candidata mais provável para remoção cirúrgica

### Hipótese principal
As rotas dedicadas abaixo são redundantes frente ao catch-all de admin e são as candidatas mais prováveis para empurrar a contagem acima do teto:

- `api/admin/auth/bootstrap.ts`
- `api/admin/auth/session.ts`

### Por que essas duas são candidatas fortes
Porque já existe barramento em:
- `api/admin/[...path].ts`

E esse barramento já resolve internamente:
- `/api/admin/auth/bootstrap`
- `/api/admin/auth/session`

### Leitura objetiva
Hoje pode estar havendo duplicidade funcional entre:
- `api/admin/[...path].ts`
- `api/admin/auth/bootstrap.ts`
- `api/admin/auth/session.ts`

Se isso estiver contando separadamente no output da Vercel, o projeto passa de 12 para 13 ou 14 funções.

---

## 6. Próxima correção recomendada — mínima e precisa

## Objetivo
Reduzir a contagem de funções sem tocar em frontend, auth lógica, admin interno ou contratos externos.

## Mudança recomendada
Remover APENAS:
- `api/admin/auth/bootstrap.ts`
- `api/admin/auth/session.ts`

## Justificativa
Os contratos externos podem continuar preservados via:
- `api/admin/[...path].ts`

Desde que o catch-all já resolva corretamente esses caminhos, o comportamento externo permanece igual e duas funções dedicadas deixam de existir.

---

## 7. O que NÃO fazer agora

Não fazer agora:
- não mexer novamente no webhook Stripe
- não mexer no checkout session
- não mexer no `vercel.json`
- não mexer no auth de usuário final
- não mexer no frontend
- não abrir branch nova
- não criar nova função em `/api`

---

## 8. Patch cirúrgico pro executor

## Passo 1
Confirmar que `api/admin/[...path].ts` já roteia:
- `auth/bootstrap`
- `auth/session`

## Passo 2
Remover os arquivos:

```txt
api/admin/auth/bootstrap.ts
api/admin/auth/session.ts
```

## Passo 3
Rodar:

```bash
npm run gate
```

## Passo 4
Push na `main`

## Passo 5
Validar novo deploy na Vercel

---

## 9. Critério de aceite dessa etapa

A etapa só vale como concluída se:
- `npm run gate` passar
- o deploy passar do `Deploying outputs...`
- não houver mais erro de `No more than 12 Serverless Functions`
- `/api/admin/auth/bootstrap` continuar respondendo
- `/api/admin/auth/session` continuar respondendo
- admin continuar íntegro

---

## 10. Previsão do próximo erro mais provável depois dessa correção

Se remover as duas funções dedicadas de admin auth e o deploy avançar, os próximos erros mais prováveis são estes, em ordem:

### Erro provável 1
`404` em:
- `/api/admin/auth/bootstrap`
- `/api/admin/auth/session`

### Causa provável
O catch-all de admin não estar preservando corretamente o contrato externo em produção.

### Como resolver
Não recriar função dedicada.
Corrigir apenas o barramento em `api/admin/[...path].ts` para resolver exatamente esses paths.

---

### Erro provável 2
Falha de auth admin por diferença de path/query em produção

### Causa provável
Algum handler de admin auth depender de detalhe de `req.url` ou `req.query` quando chamado via catch-all.

### Como resolver
Fazer ajuste mínimo no `api/admin/[...path].ts` para injetar query/shape compatível, sem reabrir função dedicada.

---

### Erro provável 3
Ainda continuar acima de 12 funções

### Causa provável
Existe outra duplicidade fora de payments, provavelmente outra entrada dedicada que o barramento já cobre.

### Como resolver
Auditar a árvore `/api` inteira e eliminar a próxima duplicidade dedicada, sem tocar na lógica dos handlers.

Candidatos seguintes, se ainda necessário:
- `api/settings.ts`
- `api/events.ts`

Mas esses dois NÃO devem ser mexidos antes de validar a remoção de `api/admin/auth/*`.

---

## 11. Ordem de execução recomendada

1. Remover `api/admin/auth/bootstrap.ts`
2. Remover `api/admin/auth/session.ts`
3. Rodar `npm run gate`
4. Push na `main`
5. Validar deploy
6. Testar rotas admin auth
7. Registrar resultado em `IMPLANTAR/19`
8. Se falhar, registrar bloqueio em `IMPLANTAR/20`

---

## 12. Registro obrigatório no IMPLANTAR

Se concluir:
- atualizar `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`

Se travar:
- atualizar `IMPLANTAR/20-BLOQUEIO-CIRURGIA-WEBHOOK-CATCH-ALL.md`
  ou criar novo bloqueio específico do admin auth / function count

---

## 13. Arquivos que já podem ser considerados concluídos / superados

Estão superados ou desatualizados pelo estado atual e podem entrar na fila de limpeza documental:

- `IMPLANTAR/24-BLOQUEIO-BUILD-STRIPE-LINT.md`
- `IMPLANTAR/25-CORRECAO-LINT-STRIPE-CONNECT.md`
- `IMPLANTAR/28-CORRECAO-CIRURGICA-DEPLOY-HOBBY-VERCEL.md`
- `IMPLANTAR/29-STATUS-REAL-CORRECAO-DEPLOY-VERCEL.md`
- `IMPLANTAR/31-PROXIMA-CORRECAO-DEPLOY.md`

### Motivo
Esses documentos não representam mais o gargalo atual com precisão.

---

## 14. Decisão final para o executor

A próxima ação correta NÃO é mais mexer no webhook.

A próxima ação correta é:

```txt
remover api/admin/auth/bootstrap.ts
remover api/admin/auth/session.ts
```

validar se isso derruba a contagem de funções para dentro do limite Hobby,
sem quebrar o contrato externo do admin auth.
