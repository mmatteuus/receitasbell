# Correção do Lint — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Objetivo

Eliminar o bloqueio atual do build causado por `@typescript-eslint/no-explicit-any` no pacote Stripe Connect.

---

## Regra única

Substituir todos os usos de `any` por `unknown` + narrow seguro.

---

## Helper obrigatório

Criar um helper local reutilizável em cada arquivo ou em utilitário compartilhado:

```ts
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'unexpected_error';
}
```

---

## Substituições exatas

### 1. `api/payments/connect/account.ts`
Trocar:
```ts
} catch (error: any) {
```
Por:
```ts
} catch (error: unknown) {
```

Trocar:
```ts
detail: error?.message ?? 'unexpected_error'
```
Por:
```ts
detail: getErrorMessage(error)
```

---

### 2. `api/payments/connect/onboarding-link.ts`
Mesma troca:
- `error: any` → `error: unknown`
- `error?.message ?? 'unexpected_error'` → `getErrorMessage(error)`

---

### 3. `api/payments/connect/refresh.ts`
Mesma troca:
- `error: any` → `error: unknown`
- `error?.message ?? 'unexpected_error'` → `getErrorMessage(error)`

---

### 4. `api/payments/connect/return.ts`
Mesma troca:
- `error: any` → `error: unknown`
- `error?.message ?? 'unexpected_error'` → `getErrorMessage(error)`

---

### 5. `api/payments/connect/status.ts`
Mesma troca:
- `error: any` → `error: unknown`
- `error?.message ?? 'unexpected_error'` → `getErrorMessage(error)`

---

### 6. `api/payments/webhook.ts`
Trocar:
```ts
const account = event.data.object as any;
```
Por uma tipagem segura:
```ts
const account = event.data.object as {
  id: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  default_currency?: string | null;
  metadata?: { tenant_id?: string };
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    disabled_reason?: string | null;
  };
};
```

E trocar também:
- `catch (error: any)` → `catch (error: unknown)`
- `error?.message ?? 'unexpected_error'` → `getErrorMessage(error)`

---

## Sequência exata

1. aplicar helper
2. trocar todos os `catch (error: any)`
3. trocar cast do webhook
4. rodar lint
5. rodar gate
6. só depois tentar deploy

---

## Comandos obrigatórios

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run gate
```

---

## Critério de aceite

- [ ] nenhum `Unexpected any` restante
- [ ] `npm run gate` passa
- [ ] só depois liberar novo deploy

---

## Observação importante

Mesmo que o warning de `vite.config.ts` não esteja bloqueando sozinho, o executor deve avaliar se convém limpar também, para reduzir ruído operacional no gate.
