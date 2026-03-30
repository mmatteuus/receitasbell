# Ordem de execução

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Sequência obrigatória

### TASK-001 — criar o domínio canônico de pagamentos
**Objetivo**: consolidar tudo em `src/server/payments/**`.

**Arquivos-alvo**
- `src/server/payments/**`
- `api/payments/[...path].ts`

**Passos**
1. criar a estrutura de pastas canônica;
2. criar `router.ts`;
3. criar entrypoint Vercel unificado;
4. não remover legado ainda.

**Comandos**
```bash
mkdir -p src/server/payments/{application/handlers,core,providers/stripe,providers/legacy,repo,contracts,shared}
mkdir -p api/payments
npm run lint
npm run typecheck
```

**Aceite**
- [ ] pasta criada
- [ ] app compila
- [ ] nenhum comportamento mudou ainda

**Rollback**
```bash
git revert HEAD
npm run gate
```

### TASK-002 — generalizar storage de pagamentos
**Objetivo**: tornar pedidos e eventos provider-agnostic.

**Pré-requisito**: TASK-001

**Passos**
1. expandir `Payment_Orders`;
2. expandir `payment_events`;
3. ajustar parser/repo para preferir campos genéricos;
4. manter compat temporária de leitura.

**Aceite**
- [ ] pedido Stripe não depende de campo MP
- [ ] leitura de pedido antigo continua possível

### TASK-003 — criar tabela `stripe_connect_accounts`
**Objetivo**: readiness operacional da conta conectada.

**Pré-requisito**: TASK-002

**Aceite**
- [ ] tabela criada
- [ ] status `ready` depende de `charges_enabled` e `payouts_enabled`

### TASK-004 — implementar connect admin-only
**Objetivo**: criar/recuperar conta e gerar onboarding link.

**Rotas**
- `POST /api/payments/connect/account`
- `POST /api/payments/connect/onboarding-link`
- `GET /api/payments/connect/status`

### TASK-005 — sincronizar catálogo local com Stripe
**Objetivo**: garantir product/price corretos.

**Regras**
- sync em create/update/publish
- `lookup_key=recipe:{tenantId}:{recipeId}:brl`
- sem cron de full sync

### TASK-006 — implementar checkout Stripe
**Objetivo**: tornar Stripe o único fluxo novo de venda.

**Rotas**
- `POST /api/payments/checkout/session`

**Aceite**
- [ ] retorna `checkoutUrl`
- [ ] grava `provider=stripe`
- [ ] idempotência ativa

### TASK-007 — implementar webhook Stripe
**Objetivo**: confirmação oficial do pagamento.

**Rotas**
- `POST /api/payments/webhooks/stripe`

**Aceite**
- [ ] assinatura validada
- [ ] dedupe por `provider_event_id`
- [ ] entitlement criado uma única vez

### TASK-008 — desligar reconcile automático
**Objetivo**: remover cron legado.

**Aceite**
- [ ] cron removido do `vercel.json`
- [ ] repair manual existe

### TASK-009 — remover Mercado Pago do runtime
**Objetivo**: apagar provider antigo do código vivo.

**Passos**
1. remover CSP/rewrite/cron/envs MP;
2. remover adapters/clients/services MP;
3. remover testes MP obsoletos;
4. varredura final de strings legadas.

**Validação final**
```bash
rg -n "mercadopago|mercado_pago|mp_" .
```
