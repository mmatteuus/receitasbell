# Implementação End-to-End — Stripe Connect

Projeto: `mmatteuus/receitasbell`  
Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

---

## Regra operacional

Executar tudo na `main`, sem branch paralela.

Não alterar o que já estabilizou:
- auth admin
- rotas admin existentes
- headers/CSP do `vercel.json`

Mudança é aditiva.

---

## 1. Arquivos a criar

Criar exatamente estes arquivos se ainda não existirem:

- `api/payments/_lib/stripe.ts`
- `api/payments/_lib/supabase-admin.ts`
- `api/payments/_lib/connect-store.ts`
- `api/payments/connect/account.ts`
- `api/payments/connect/onboarding-link.ts`
- `api/payments/connect/status.ts`
- `api/payments/connect/refresh.ts`
- `api/payments/connect/return.ts`
- `api/payments/webhook.ts`

---

## 2. Variáveis de ambiente obrigatórias

Adicionar na Vercel, em Production, Preview e Development quando aplicável:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Não commitar valores reais.

---

## 3. Tabela alvo no Supabase

Usar `public.stripe_connect_accounts` como tabela canônica do Connect.

Campos relevantes já vistos:
- `tenant_id`
- `stripe_account_id`
- `status`
- `details_submitted`
- `charges_enabled`
- `payouts_enabled`
- `requirements_currently_due_json`
- `requirements_eventually_due_json`
- `default_currency`
- `disabled_reason`
- `created_at`
- `updated_at`

Regra: 1 registro por `tenant_id`.

---

## 4. Fluxo exato de criação

### Passo A — criar utilitário Stripe
Criar `api/payments/_lib/stripe.ts`.

Responsabilidade:
- instanciar `new Stripe(process.env.STRIPE_SECRET_KEY, ...)`
- falhar cedo se env estiver ausente

### Passo B — criar utilitário Supabase admin
Criar `api/payments/_lib/supabase-admin.ts`.

Responsabilidade:
- instanciar client com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- usar somente no backend

### Passo C — criar store Connect
Criar `api/payments/_lib/connect-store.ts`.

Responsabilidade:
- buscar conta por tenant
- salvar/upsert do estado
- derivar status canônico

### Passo D — criar endpoint `account`
Criar `api/payments/connect/account.ts`.

Responsabilidade:
- receber `tenantId`
- verificar se já existe conta salva
- se existir, retornar a existente
- se não existir, criar `type: 'express'`
- persistir em `stripe_connect_accounts`

### Passo E — criar endpoint `onboarding-link`
Criar `api/payments/connect/onboarding-link.ts`.

Responsabilidade:
- receber `tenantId` e opcionalmente `accountId`
- garantir conta existente
- criar `accountLinks.create`
- usar `refresh_url` e `return_url`
- retornar a URL

### Passo F — criar endpoint `status`
Criar `api/payments/connect/status.ts`.

Responsabilidade:
- ler do banco por tenant
- se existir conta, buscar também no Stripe
- sincronizar campos principais
- retornar estado final

### Passo G — criar endpoint `refresh`
Criar `api/payments/connect/refresh.ts`.

Responsabilidade:
- regenerar onboarding link para a conta já salva
- redirecionar ou retornar URL nova

### Passo H — criar endpoint `return`
Criar `api/payments/connect/return.ts`.

Responsabilidade:
- ao voltar do Stripe, buscar conta no Stripe
- persistir status atualizado
- redirecionar ao painel admin com querystring de sucesso

### Passo I — criar webhook
Criar `api/payments/webhook.ts`.

Responsabilidade:
- validar assinatura do Stripe
- aceitar `account.updated`
- sincronizar `details_submitted`, `charges_enabled`, `payouts_enabled`, `disabled_reason`

---

## 5. URLs obrigatórias

### APP_URL
Deve apontar para o domínio final ativo em produção.

### return_url
Formato obrigatório:
```text
${APP_URL}/api/payments/connect/return?tenantId=<tenantId>
```

### refresh_url
Formato obrigatório:
```text
${APP_URL}/api/payments/connect/refresh?tenantId=<tenantId>
```

---

## 6. Regras do Stripe Connect a respeitar

### FATO oficial
- onboarding exige `return_url` e `refresh_url`
- `return_url` não garante que a conta está completa
- após retorno é obrigatório consultar a conta ou ouvir `account.updated`
- `refresh_url` deve gerar novo account link

Aplicação prática:
- nunca marcar conta como ativa só porque retornou do Stripe
- conta só fica `active` quando `charges_enabled=true` e `payouts_enabled=true`

---

## 7. Regras de não-quebra

- não substituir rotas antigas
- não alterar endpoints admin existentes
- não alterar build command
- não alterar CSP
- não remover tabelas
- não mexer em auth
- tudo novo deve ser aditivo

---

## 8. Validação local

Executar, nesta ordem:

```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Depois testar endpoints com curl.

### Teste 1 — account
```bash
curl -X POST http://localhost:3000/api/payments/connect/account \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID","email":"admin@receitasbell.com"}'
```

### Teste 2 — onboarding-link
```bash
curl -X POST http://localhost:3000/api/payments/connect/onboarding-link \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID"}'
```

### Teste 3 — status
```bash
curl "http://localhost:3000/api/payments/connect/status?tenantId=TENANT_UUID"
```

---

## 9. Validação em produção

Depois do deploy READY:

```bash
curl -X POST https://receitasbell.vercel.app/api/payments/connect/account \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID","email":"admin@receitasbell.com"}'
```

```bash
curl -X POST https://receitasbell.vercel.app/api/payments/connect/onboarding-link \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID"}'
```

Critério de aceite:
- não pode retornar 404
- deve retornar 200
- onboarding deve abrir

---

## 10. Rollback

Se qualquer parte quebrar:

1. reverter o commit do Stripe Connect
2. aguardar redeploy
3. validar admin novamente

Comando:
```bash
git revert HEAD
```

---

## 11. Definition of Done

Concluído somente quando:
- todos os endpoints novos existem
- produção não retorna 404 nas duas rotas críticas
- conta Connect é criada ou reutilizada
- onboarding URL é emitida
- status é persistido no Supabase
- webhook sincroniza conta
- painel admin permanece funcional
