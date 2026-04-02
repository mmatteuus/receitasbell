# Bloqueio Atual — Build do Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Bloqueio atual

O deploy do pacote Stripe Connect falhou na Vercel antes de publicar.

### Fato
O comando que falhou foi:

```bash
npm run gate
```

### Fato
A falha ocorreu no passo:

```bash
npm run lint
```

### Fato
Motivo principal:
- regra `@typescript-eslint/no-explicit-any`

---

## Arquivos com erro

1. `api/payments/connect/account.ts`
2. `api/payments/connect/onboarding-link.ts`
3. `api/payments/connect/refresh.ts`
4. `api/payments/connect/return.ts`
5. `api/payments/connect/status.ts`
6. `api/payments/webhook.ts`

Erro adicional não bloqueante grave, mas presente:
- `vite.config.ts` com warning `prefer-const`

---

## O que isso significa

- o código do Stripe Connect foi criado
- mas ainda não está apto a passar no gate
- portanto não deve ser tratado como funcional em produção

---

## Causa raiz mais provável

O Executor usou `catch (error: any)` e cast/objeto com `any` em múltiplos pontos.

Isso viola a regra de lint do projeto.

---

## Correção obrigatória

Substituir `any` por tipos seguros.

Padrão recomendado:

```ts
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'unexpected_error';
}
```

E depois:

```ts
} catch (error: unknown) {
  return res.status(500).json({
    ok: false,
    error: 'nome_do_erro',
    detail: getErrorMessage(error),
  });
}
```

No webhook, evitar:

```ts
const account = event.data.object as any;
```

Preferir tipagem explícita com narrowing seguro.

---

## Próxima task real

Nova prioridade operacional antes de novo deploy:
- corrigir lint do pacote Stripe Connect

Executor deve registrar isso como passo obrigatório antes de `STRIPE-010`.

---

## Regra

Não tentar validar Stripe em produção novamente antes de:
- lint ok
- typecheck ok
- build ok
- test unit ok
- gate ok
