# ENV e Dados Operacionais — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

---

## Dados confirmados

### GitHub
- repositório: `mmatteuus/receitasbell`
- branch obrigatória: `main`

### Vercel
- team id: `team_eSrpVaqo7ajxagf5Fl4YcH3A`
- project id: `prj_j1CPT7Y6j9ezx26rifAfrl29x9GE`
- project name: `receitasbell`
- framework: `vite`
- node: `20.x`
- build command: `npm run gate`

### Supabase
- project url: `https://ixfwvaszmngbyxrdiaha.supabase.co`
- tabela connect: `public.stripe_connect_accounts`

### Stripe
- account id: `acct_1T4JaqCXD5Lwt8YN`
- display name: `Área restrita de New business`
- dashboard keys: `https://dashboard.stripe.com/acct_1T4JaqCXD5Lwt8YN/apikeys`

---

## Variáveis obrigatórias

Adicionar na Vercel:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=
APP_URL=
SUPABASE_URL=https://ixfwvaszmngbyxrdiaha.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Onde preencher cada variável

### `STRIPE_SECRET_KEY`
Origem:
- Stripe Dashboard
- Developers
- API keys
- usar chave do modo correto do ambiente

### `STRIPE_WEBHOOK_SECRET`
Origem:
- Stripe Dashboard
- Developers
- Webhooks
- criar endpoint apontando para `/api/payments/webhook`
- copiar `Signing secret`

### `VITE_STRIPE_PUBLISHABLE_KEY`
Origem:
- Stripe Dashboard
- Developers
- API keys
- usar publishable key do modo correto

### `APP_URL`
Valor:
- domínio final da aplicação em produção
- usar HTTPS

### `SUPABASE_SERVICE_ROLE_KEY`
Origem:
- Supabase project settings
- API
- usar somente backend

---

## Regras obrigatórias

- não commitar nenhum valor secreto
- não colar segredos em arquivos `.md`
- não usar `SUPABASE_SERVICE_ROLE_KEY` no frontend
- não usar `STRIPE_SECRET_KEY` no frontend
- conferir se `APP_URL` termina sem barra final

---

## Endpoint de webhook no Stripe

Cadastrar endpoint:

```text
https://SEU_DOMINIO/api/payments/webhook
```

Evento mínimo a assinar:
- `account.updated`

Pode incluir também:
- `capability.updated`

---

## Tabela canônica

Usar apenas esta tabela para estado Stripe Connect:
- `public.stripe_connect_accounts`

Não criar segunda tabela para a mesma finalidade neste passo.

---

## Estado canônico

- `pending`
- `restricted`
- `active`
- `rejected`

Regra operacional:
- `active` somente quando `charges_enabled=true` e `payouts_enabled=true`
- retorno do onboarding sozinho não significa conta ativa

---

## Falhas já identificadas

- frontend chama rotas inexistentes e recebe `404`
- backend atual não expõe `account` nem `onboarding-link`
- banco possui estrutura, mas fluxo não foi concluído

---

## Não fazer

- não trocar auth do admin
- não mexer em domínio
- não alterar headers do `vercel.json`
- não remover nada de pagamento já existente
