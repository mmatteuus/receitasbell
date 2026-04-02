# Correção Cirúrgica — Erro Atual do Deploy na Vercel Hobby

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## FATO

O último deploy não falhou em lint, typecheck, build ou testes.

O último deploy falhou na etapa final de publicação com este erro:

```text
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

---

## Diagnóstico exato

Já existe uma função agregadora para pagamentos:

- `api/payments/[...path].ts`

Essa função delega para:

- `src/server/payments/router.ts`

Esse router já resolve rotas de Connect como:
- `/api/payments/connect/account`
- `/api/payments/connect/onboarding-link`
- `/api/payments/connect/status`

Portanto, criar arquivos adicionais em:
- `api/payments/connect/account.ts`
- `api/payments/connect/onboarding-link.ts`

foi redundante e aumentou a contagem de Serverless Functions desnecessariamente.

---

## Causa raiz

O projeto já usa o padrão correto de **catch-all router** para pagamentos.

O erro de deploy apareceu porque foram adicionadas funções dedicadas em `/api/payments/connect/*` em vez de reutilizar o catch-all já existente.

---

## Correção cirúrgica obrigatória

### Objetivo
Reduzir a contagem de funções sem quebrar o app e sem mudar o contrato externo das rotas.

### Ação exata
Remover estes arquivos do repositório:

```text
api/payments/connect/account.ts
api/payments/connect/onboarding-link.ts
```

Não tocar nestes arquivos:

```text
api/payments/[...path].ts
src/server/payments/router.ts
src/server/payments/application/handlers/connect/account.ts
src/server/payments/application/handlers/connect/onboarding-link.ts
src/server/payments/application/handlers/connect/status.ts
```

---

## Por que isso funciona

Depois da remoção dos arquivos duplicados:

- a URL externa continua igual
- `/api/payments/connect/account` continua existindo
- `/api/payments/connect/onboarding-link` continua existindo
- quem passa a responder é a função catch-all `api/payments/[...path].ts`
- o router interno já sabe delegar para os handlers corretos
- a contagem de funções cai

---

## O que NÃO fazer

- não criar mais arquivos em `/api/payments/connect/`
- não trocar o auth admin
- não refatorar o Stripe inteiro agora
- não mexer em frontend
- não abrir branch
- não remover `api/payments/[...path].ts`

---

## Sequência exata de execução

1. apagar `api/payments/connect/account.ts`
2. apagar `api/payments/connect/onboarding-link.ts`
3. conferir que `src/server/payments/router.ts` continua roteando `connect/account` e `connect/onboarding-link`
4. rodar `npm run gate`
5. fazer commit na `main`
6. fazer `push origin main`
7. aguardar novo deploy
8. validar produção

---

## Comandos exatos

```bash
rm api/payments/connect/account.ts
rm api/payments/connect/onboarding-link.ts
npm run gate
git add .
git commit -m "fix: reduce vercel function count by reusing payments catch-all"
git push origin main
```

---

## Critério de aceite

- [ ] `npm run gate` passa
- [ ] deploy não falha mais por limite de funções
- [ ] `/api/payments/connect/account` responde sem 404
- [ ] `/api/payments/connect/onboarding-link` responde sem 404
- [ ] admin continua funcionando

---

## Se o erro de contagem continuar

Próxima inspeção obrigatória:
- revisar se existe outro arquivo redundante em `/api/payments/` além do catch-all
- verificar especificamente se `api/payments/webhook.ts` é indispensável ou se está sobrando

Mas essa segunda etapa só deve acontecer se a remoção dos dois arquivos acima não for suficiente.

---

## Status decisório

### Decisão do Pensante
Aplicar primeiro a menor mudança possível:
- remover apenas os dois arquivos duplicados de Connect

### Justificativa
Essa é a correção com menor risco e maior chance de destravar o deploy imediatamente.
