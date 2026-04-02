# Checklist de Validação e Rollback — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

---

## Ordem de execução obrigatória

1. preencher envs na Vercel
2. criar arquivos utilitários
3. criar endpoints `account` e `onboarding-link`
4. criar endpoints `status`, `refresh`, `return`
5. criar webhook
6. rodar gate local
7. commit na `main`
8. aguardar Vercel `READY`
9. validar com curl
10. validar pelo painel admin

---

## Checklist técnico

- [ ] `api/payments/_lib/stripe.ts` criado
- [ ] `api/payments/_lib/supabase-admin.ts` criado
- [ ] `api/payments/_lib/connect-store.ts` criado
- [ ] `api/payments/connect/account.ts` criado
- [ ] `api/payments/connect/onboarding-link.ts` criado
- [ ] `api/payments/connect/status.ts` criado
- [ ] `api/payments/connect/refresh.ts` criado
- [ ] `api/payments/connect/return.ts` criado
- [ ] `api/payments/webhook.ts` criado
- [ ] nenhum endpoint novo retorna `404`
- [ ] tabela `public.stripe_connect_accounts` recebe/upserta registros
- [ ] admin continua logando normalmente

---

## Comandos obrigatórios

```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run gate
```

Critério de aceite:
- todos passam sem erro

---

## Testes com curl

### 1. Criar ou reutilizar conta
```bash
curl -X POST https://receitasbell.vercel.app/api/payments/connect/account \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID","email":"admin@receitasbell.com"}'
```

Esperado:
- HTTP 200
- JSON com `ok: true`
- JSON com `accountId`

### 2. Gerar onboarding link
```bash
curl -X POST https://receitasbell.vercel.app/api/payments/connect/onboarding-link \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"TENANT_UUID"}'
```

Esperado:
- HTTP 200
- JSON com `url`
- sem `404`

### 3. Ler status
```bash
curl "https://receitasbell.vercel.app/api/payments/connect/status?tenantId=TENANT_UUID"
```

Esperado:
- HTTP 200
- JSON com `data.status`

---

## Teste funcional manual

1. abrir painel admin
2. ir à área de pagamentos/configurações
3. clicar em conectar Stripe
4. confirmar redirecionamento ao Stripe
5. finalizar ou avançar onboarding
6. voltar ao app
7. conferir status atualizado

Esperado:
- sem tela quebrada
- sem 404
- sem logout admin

---

## Validação do banco

Executar consulta no Supabase:

```sql
select
  tenant_id,
  stripe_account_id,
  status,
  details_submitted,
  charges_enabled,
  payouts_enabled,
  disabled_reason,
  updated_at
from public.stripe_connect_accounts
order by updated_at desc;
```

Esperado:
- registro do tenant atualizado
- `stripe_account_id` preenchido

---

## Critérios de aceite finais

- [ ] produção em `READY`
- [ ] duas rotas críticas sem `404`
- [ ] onboarding URL emitida
- [ ] return sincroniza estado
- [ ] webhook recebe eventos
- [ ] admin continua funcional

---

## Rollback

### Quando fazer rollback
Executar rollback se ocorrer qualquer um:
- erro no login admin após deploy
- erro 500 recorrente em rotas de pagamento já existentes
- regressão no painel
- build quebrado em produção

### Como fazer rollback
```bash
git revert HEAD
```

Depois:
- push na `main`
- aguardar novo deploy `READY`
- validar admin e home

### O que não precisa rollback
- se apenas faltar env, corrigir env na Vercel e redeploy
- se webhook estiver mal configurado no Stripe, corrigir no painel Stripe

---

## Protocolo de não-quebra aplicado

- mudança aditiva: sim
- alteração de auth existente: não
- remoção de rota existente: não
- mudança destrutiva de banco: não
- rollback em 1 comando: sim
