# Bloqueio de execucao — cirurgia do webhook no catch-all de pagamentos

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Status

NAO_CONCLUIDA por limitacao operacional do conector de escrita disponivel nesta sessao.

---

## Objetivo desta etapa

Destravar o deploy da Vercel Hobby sem abrir novas frentes, absorvendo `api/payments/webhook.ts` no catch-all `api/payments/[...path].ts` e preservando:

- checkout
- painel admin
- auth existente
- contrato externo `/api/payments/webhook`

---

## Fatos auditados nesta execucao

1. O catch-all `api/payments/[...path].ts` existe, mas ainda nao exporta `config.api.bodyParser = false`.
2. A funcao dedicada `api/payments/webhook.ts` ainda existe e hoje e a superficie excedente mais provavel.
3. O router de pagamentos ainda aceita apenas `webhooks/stripe`; ainda nao aceita o contrato legado `webhook`.
4. O checkout session ainda usa `req.body` direto e precisa passar a usar `readJsonBody(...)` para continuar funcional quando o catch-all ficar com `bodyParser: false`.
5. O ultimo deploy `READY` auditado (`dpl_AwYhRqudtpEbRDAh6zEQZAAa5G4x`) registrou `lambdaRuntimeStats = {"nodejs":12}`.
6. O deploy mais recente da `main` auditado nesta sessao (`dpl_5H1GjfaLYatS3FyjwtGwut2U5JeQ`, commit `babab8822dcad091af09b4764fa0f97a12942fdd`) apresentou conflito factual com o contexto anterior: ele falhou no `npm run gate` com `eslint: command not found`, antes de `Deploying outputs...`.

---

## Motivo exato da nao conclusao

Foi possivel:
- auditar GitHub
- auditar Vercel
- fechar o patch minimo
- validar o `HEAD` atual da `main`

Nao foi possivel gravar a correcao diretamente nos arquivos ja existentes porque o conector GitHub disponivel nesta sessao permite leitura, comparacao e criacao de arquivo novo, mas nao expõe operacao simples de update de arquivo nem forneceu o `tree_sha` base necessario para montar um commit atomico via `create_tree/create_commit`.

Bloqueio operacional desta sessao:
- escrita direta em arquivos existentes do repositorio

Isso e limitacao da ferramenta da sessao, nao do projeto.

---

## Patch cirurgico pronto para aplicar

### 1) `api/payments/[...path].ts`

Substituir por:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { paymentsRouter } from '../../src/server/payments/router.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  await paymentsRouter(request, response);
}
```

### 2) `src/server/shared/http.ts`

Adicionar o helper abaixo antes de `readJsonBody` e substituir a implementacao atual de `readJsonBody`:

```ts
type RawBodyCapableRequest = VercelRequest & { __rawBody?: Buffer };

async function readRawBody(req: RawBodyCapableRequest): Promise<Buffer> {
  if (req.__rawBody) return req.__rawBody;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  req.__rawBody = Buffer.concat(chunks);
  return req.__rawBody;
}

export async function readJsonBody<T>(req: VercelRequest): Promise<T> {
  if (typeof req.body === 'string') {
    if (!req.body.trim()) return {} as T;
    return JSON.parse(req.body) as T;
  }

  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString('utf8').trim();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  if (req.body != null) {
    return req.body as T;
  }

  const rawBody = await readRawBody(req as RawBodyCapableRequest);
  const text = rawBody.toString('utf8').trim();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
```

### 3) `src/server/payments/router.ts`

Trocar apenas o bloco de resolucao do webhook por este:

```ts
  const isLegacyWebhookRoute = parts.length === 1 && parts[0] === 'webhook';
  const isStripeWebhookRoute = parts.length === 2 && parts[0] === 'webhooks' && parts[1] === 'stripe';

  if (parts.length === 2 && parts[0] === 'connect' && parts[1] === 'account') {
    target = connectAccountHandler;
  } else if (parts.length === 2 && parts[0] === 'connect' && parts[1] === 'onboarding-link') {
    target = connectLinkHandler;
  } else if (parts.length === 2 && parts[0] === 'connect' && parts[1] === 'status') {
    target = connectStatusHandler;
  } else if (parts.length === 2 && parts[0] === 'checkout' && parts[1] === 'session') {
    target = checkoutSessionHandler;
  } else if (isLegacyWebhookRoute || isStripeWebhookRoute) {
    target = webhookStripeHandler;
  }
```

### 4) `src/server/payments/application/handlers/checkout/session.ts`

Ajustar o import e a leitura do body.

#### Import

Trocar:

```ts
import { withApiHandler } from '../../../../shared/http.js';
```

Por:

```ts
import { readJsonBody, withApiHandler } from '../../../../shared/http.js';
```

#### Body

Trocar:

```ts
  const body = (req.body ?? {}) as {
```

Por:

```ts
  const body = await readJsonBody<{
```

E manter o restante do shape exatamente igual ate o fechamento `};`.

### 5) Remocao obrigatoria

Remover o arquivo:

```txt
api/payments/webhook.ts
```

---

## Escopo explicitamente preservado

Nao mexer nesta etapa em:

- frontend
- auth admin
- painel admin
- rotas publicas fora de pagamentos
- integracao Stripe alem do necessario para manter webhook + checkout
- `vercel.json` (nesta correcao cirurgica)

---

## Ordem recomendada ao executor

1. Aplicar o patch exatamente como acima.
2. Remover `api/payments/webhook.ts`.
3. Rodar `npm run gate` localmente.
4. Fazer push na `main`.
5. Validar o novo deploy da Vercel.
6. Confirmar que `/api/payments/webhook` responde sem 404.
7. Confirmar que `/api/payments/checkout/session` continua operacional.

---

## Risco residual previsto

### Risco baixo
- compatibilidade do checkout apos `bodyParser: false`
  - mitigacao: `readJsonBody(...)` passa a consumir stream bruto quando `req.body` vier vazio

### Risco baixo
- preservacao da URL externa do webhook
  - mitigacao: router passa a aceitar tanto `/api/payments/webhook` quanto `/api/payments/webhooks/stripe`

### Risco medio externo ao patch
- o deploy mais recente auditado falhou antes do publish com `eslint: command not found`
  - isso conflita com o estado descrito em `IMPLANTAR/31`
  - se reaparecer apos o patch, registrar como bloqueio separado e nao misturar com a cirurgia de funcoes

---

## Rollback

Rollback simples:

1. restaurar `api/payments/webhook.ts`
2. remover `bodyParser: false` do catch-all
3. restaurar a condicao anterior do router
4. restaurar o checkout para o estado anterior

---

## Proximo passo sugerido ao Pensante

Autorizar o executor humano ou um ambiente com escrita completa no repositorio a aplicar exatamente este patch na `main` e, em seguida, validar se o erro remanescente e apenas o limite de funcoes ou se o bloqueio de `eslint` tambem precisa de tratamento separado.
