# 34 — Dossiê completo do executor

Projeto: `mmatteuus/receitasbell`
Branch: `main`
Modo: cirúrgico, não-quebra, sem abrir novas frentes
Objetivo imediato: destravar o deploy de produção na Vercel Hobby

---

## 1. Resumo executivo

### Decisão final
A próxima ação correta não é mais mexer no webhook Stripe.

A próxima ação correta é:

1. remover duas funções redundantes de admin auth
2. validar que o barramento `api/admin/[...path].ts` preserva o contrato externo
3. redeployar
4. confirmar que o erro de function count sumiu
5. só então limpar os arquivos `IMPLANTAR` já superados

### Corte cirúrgico
Remover apenas:

```txt
api/admin/auth/bootstrap.ts
api/admin/auth/session.ts
```

Esses dois arquivos hoje são wrappers redundantes.

---

## 2. Fatos validados antes desta ordem

### FATO 1 — erro atual real do deploy
O último deploy auditado é:
- `dpl_BLRZcQvcoeiBNkGsYa8FAtoj3UJ8`
- commit: `0a7993bf82bf1129e7a811eec40dba21271771a5`

Esse deploy:
- passou `npm install`
- passou `npm run gate`
- passou lint
- passou typecheck
- passou build
- passou testes
- concluiu output build
- falhou só em `Deploying outputs...`

Erro final:

```txt
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

### FATO 2 — a cirurgia de webhook já foi aplicada
Estado atual confirmado:
- `api/payments/[...path].ts` já está com `bodyParser: false`
- `src/server/shared/http.ts` já possui leitura de body compatível
- `src/server/payments/application/handlers/checkout/session.ts` já usa `readJsonBody(...)`
- `src/server/payments/router.ts` já aceita `/api/payments/webhook`
- `api/payments/webhook.ts` não existe mais na `main`

Conclusão:
- o excedente de função não está mais no webhook

### FATO 3 — existe duplicidade real no admin auth
O catch-all `api/admin/[...path].ts` já roteia internamente:
- `auth/bootstrap`
- `auth/session`

Ao mesmo tempo ainda existem as funções dedicadas:
- `api/admin/auth/bootstrap.ts`
- `api/admin/auth/session.ts`

Esses dois arquivos são wrappers finos para handlers que o catch-all já alcança.

---

## 3. Justificativa técnica da correção

### Estado atual
Hoje convivem ao mesmo tempo:

#### Barramento catch-all
- `api/admin/[...path].ts`

#### Funções dedicadas potencialmente redundantes
- `api/admin/auth/bootstrap.ts`
- `api/admin/auth/session.ts`

### Por que isso é o alvo certo
Na Vercel Hobby, o gargalo atual é contagem de funções.

Se o barramento já cobre exatamente as duas rotas externas e as funções dedicadas não adicionam lógica própria, remover essas entradas reduz a superfície de funções sem alterar a lógica real dos handlers.

### O que preserva o comportamento
O catch-all de admin já resolve:

```txt
/api/admin/auth/bootstrap
/api/admin/auth/session
```

via roteamento interno para os mesmos handlers.

---

## 4. Prova do estado atual do código

### 4.1 Catch-all do admin já resolve auth/bootstrap e auth/session
Arquivo:
- `api/admin/[...path].ts`

Esse arquivo já importa e despacha:
- `../../api_handlers/admin/auth/bootstrap.js`
- `../../api_handlers/admin/auth/session.js`

E já contém as regras:
- `parts[0] === 'auth' && parts[1] === 'bootstrap'`
- `parts[0] === 'auth' && parts[1] === 'session'`

### 4.2 bootstrap.ts é wrapper redundante
Arquivo:
- `api/admin/auth/bootstrap.ts`

Conteúdo funcional:
- importa `../../../api_handlers/admin/auth/bootstrap.js`
- apenas delega `req` e `res`
- não adiciona lógica própria

### 4.3 session.ts é wrapper redundante
Arquivo:
- `api/admin/auth/session.ts`

Conteúdo funcional:
- importa `../../../api_handlers/admin/auth/session.js`
- apenas delega `req` e `res`
- não adiciona lógica própria

### Conclusão objetiva
Esses dois arquivos são as candidatas mais limpas para cortar função sem quebrar a lógica da aplicação.

---

## 5. Ordem oficial de execução

## Passo 1 — não mexer em mais nada
Não tocar em:
- frontend
- webhook Stripe
- checkout Stripe
- auth de usuário final
- config extra da Vercel
- outras rotas `/api`

## Passo 2 — remover as duas funções redundantes
Apagar:

```txt
api/admin/auth/bootstrap.ts
api/admin/auth/session.ts
```

## Passo 3 — validar localmente
Executar:

```bash
npm run gate
```

Esperado:
- lint ok
- typecheck ok
- build ok
- testes ok

## Passo 4 — push na `main`
Sem branch nova.

## Passo 5 — validar o novo deploy na Vercel
Critério:
- deve passar de `Deploying outputs...`
- não pode repetir `No more than 12 Serverless Functions`

## Passo 6 — validar contrato externo do admin auth
Testar em produção:

```txt
/api/admin/auth/bootstrap
/api/admin/auth/session
```

Verificar que:
- não retorna 404
- responde como antes
- painel admin continua íntegro

## Passo 7 — registrar no IMPLANTAR
Se concluir:
- atualizar `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`

Se travar:
- registrar bloqueio novo em `IMPLANTAR/20...`

---

## 6. Critérios de aceite

A correção só é aceita se TODOS estes pontos forem verdadeiros:

1. `npm run gate` passou
2. deploy não falhou mais por function count
3. `/api/admin/auth/bootstrap` continua respondendo
4. `/api/admin/auth/session` continua respondendo
5. painel admin não quebrou
6. nenhuma branch nova foi criada
7. nenhuma nova função `/api` foi adicionada

---

## 7. Próximo erro provável já previsto

Mesmo com a correção certa, o executor deve ficar atento a este encadeamento:

### Próximo erro provável 1
`404` em rotas de admin auth

#### Sintoma
Após remover os dois arquivos dedicados, o deploy passa, mas:
- `/api/admin/auth/bootstrap` retorna `404`
- ou `/api/admin/auth/session` retorna `404`

#### Causa provável
O barramento `api/admin/[...path].ts` não foi acionado como esperado em produção para aquele path.

#### Correção permitida
Não recriar função dedicada automaticamente.
Primeiro verificar:
- se a rota chegou no catch-all
- se `readPath` está extraindo corretamente
- se houve diferença de `req.url` ou `req.query` no ambiente Vercel

#### Correção mínima aceitável
Ajustar apenas o barramento `api/admin/[...path].ts`.

---

### Próximo erro provável 2
Auth admin responde, mas a sessão quebra

#### Sintoma
- rota existe
- mas bootstrap/session volta payload incorreto ou sem estado esperado

#### Causa provável
Algum handler depende de shape específico de `req.url`, `req.query` ou headers quando chamado pela função dedicada.

#### Correção mínima aceitável
Compatibilizar o `request` no catch-all antes de delegar ao handler.

Exemplos do que pode precisar:
- setar query param
- preservar pathname esperado
- normalizar headers

Sem recriar função dedicada de saída.

---

### Próximo erro provável 3
O deploy ainda continua acima do limite de 12

#### Interpretação
Existe outra duplicidade de função fora de payments e fora desses dois arquivos.

#### Como seguir
Auditar a árvore `/api` procurando padrão:
- arquivo dedicado que só delega
- rota já coberta por barramento existente

#### Candidatos seguintes
Só avaliar depois de validar admin auth:
- `api/settings.ts`
- `api/events.ts`

Não mexer neles agora.

---

## 8. Rollback

Se a remoção quebrar admin auth, rollback simples:

1. restaurar `api/admin/auth/bootstrap.ts`
2. restaurar `api/admin/auth/session.ts`
3. push na `main`
4. validar retorno do comportamento anterior

Importante:
- rollback só se o barramento não preservar o contrato
- não misturar rollback com mudanças no webhook

---

## 9. Limpeza documental recomendada

Esta limpeza só deve ser feita DEPOIS da validação do deploy ou em commit separado de docs.

### Arquivos IMPLANTAR já superados ou desatualizados
Podem entrar na fila de remoção:

```txt
IMPLANTAR/24-BLOQUEIO-BUILD-STRIPE-LINT.md
IMPLANTAR/25-CORRECAO-LINT-STRIPE-CONNECT.md
IMPLANTAR/28-CORRECAO-CIRURGICA-DEPLOY-HOBBY-VERCEL.md
IMPLANTAR/29-STATUS-REAL-CORRECAO-DEPLOY-VERCEL.md
IMPLANTAR/31-PROXIMA-CORRECAO-DEPLOY.md
```

### Motivo
Esses arquivos já não representam o gargalo atual com precisão.

### Regra de segurança
Não misturar:
- remoção de função de produção
com
- limpeza massiva de docs

Se possível, fazer a limpeza documental só após o deploy passar.

---

## 10. Checklist operacional para o executor

### Antes de editar
- [ ] confirmar que está na `main`
- [ ] não abrir branch
- [ ] não mexer em webhook/payments agora

### Mudança
- [ ] remover `api/admin/auth/bootstrap.ts`
- [ ] remover `api/admin/auth/session.ts`

### Validação local
- [ ] rodar `npm run gate`
- [ ] confirmar tudo verde

### Deploy
- [ ] push na `main`
- [ ] observar deploy da Vercel
- [ ] confirmar que passou de `Deploying outputs...`
- [ ] confirmar que o erro de function count sumiu

### Validação funcional
- [ ] testar `/api/admin/auth/bootstrap`
- [ ] testar `/api/admin/auth/session`
- [ ] validar painel admin

### Registro
- [ ] registrar evidência em `IMPLANTAR/19`
- [ ] se falhar, registrar bloqueio novo em `IMPLANTAR/20`

---

## 11. Ordem curta final

O executor deve seguir exatamente isto:

```txt
1. apagar api/admin/auth/bootstrap.ts
2. apagar api/admin/auth/session.ts
3. rodar npm run gate
4. push na main
5. validar deploy
6. testar bootstrap/session do admin
7. registrar em IMPLANTAR/19 ou IMPLANTAR/20
```

---

## 12. Decisão final

A reauditoria corrigida fecha assim:

- webhook: já resolvido
- eslint: não é mais o bloqueio dominante
- erro atual real: function count na Vercel Hobby
- melhor próximo corte: remover as duas funções redundantes de admin auth

Essa é a correção mais precisa, menor e com melhor relação risco/retorno neste momento.
