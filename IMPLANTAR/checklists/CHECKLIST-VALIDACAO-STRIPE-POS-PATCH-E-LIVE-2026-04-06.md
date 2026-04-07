# CHECKLIST — Validação Stripe Pós-Patch e Pós-LIVE

**Data:** 2026-04-06  
**Objetivo:** validar o fluxo Stripe de ponta a ponta sem improviso  
**Executores principais:** OpenCode + Antigravity  

---

## 0. REGRA DE OURO

**Não** fazer cutover para LIVE enquanto estes três itens não estiverem verdadeiros:

- [ ] patch de código aplicado
- [ ] `npm run gate` verde ou equivalente (`lint + typecheck + build + test:unit`)
- [ ] Vercel canônico e Stripe canônico confirmados

---

## 1. PRÉ-PATCH — CONFIRMAÇÕES BASE

### 1.1 Código

- [ ] OpenCode aplicou os patches de `IMPLANTAR/patches`
- [ ] nenhum arquivo crítico ficou parcialmente editado
- [ ] rota correta mantida no código:
  - [ ] `/api/payments/webhooks/stripe`
  - [ ] `/api/payments/webhook` (alias)
- [ ] rota errada **não** foi usada em docs/config:
  - [ ] `/api/payments/stripe/webhook`

### 1.2 Banco

- [ ] `payment_orders` continua com `amount_cents`
- [ ] `payment_orders` continua com `metadata`
- [ ] `payment_orders` continua com `provider_event_id`
- [ ] `payment_orders` continua com `provider_metadata_json`
- [ ] `payment_events` existe
- [ ] `entitlements` existe
- [ ] `stripe_connect_accounts` existe

### 1.3 Produção canônica

- [ ] Antigravity confirmou o projeto Vercel real
- [ ] Antigravity confirmou o domínio de produção real
- [ ] Antigravity confirmou a conta Stripe da plataforma real
- [ ] Antigravity confirmou se Connect está habilitado

---

## 2. PÓS-PATCH — VALIDAÇÃO LOCAL / BUILD

### 2.1 Gate técnico

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:unit`

### 2.2 Critérios mínimos de aceite técnico

- [ ] `checkout/session.ts` não grava email em `payment_orders.user_id`
- [ ] `repo.ts` usa `amount_cents` em vez de `amount`
- [ ] `repo.ts` usa `metadata.payerEmail` em vez de `payer_email`
- [ ] webhook não grava colunas inválidas em `recipe_purchases`
- [ ] webhook usa `entitlements`
- [ ] webhook grava evento em `payment_events`
- [ ] webhook salva `provider_event_id`
- [ ] reprocessamento do mesmo `event.id` não duplica grant

---

## 3. PÓS-DEPLOY — VALIDAÇÃO EM PREVIEW/PROD ANTES DO LIVE

### 3.1 Deploy

- [ ] último deploy está `READY`/saudável
- [ ] health check responde
- [ ] rota pública principal responde
- [ ] admin responde
- [ ] rota de checkout responde sem 500

### 3.2 Env vars Vercel

- [ ] `STRIPE_SECRET_KEY` configurada no projeto correto
- [ ] `STRIPE_WEBHOOK_SECRET` configurada no projeto correto
- [ ] `APP_BASE_URL` aponta para o domínio correto
- [ ] variáveis foram aplicadas no ambiente correto (`production` ou `preview` conforme fase)

### 3.3 Webhook Stripe

- [ ] endpoint criado na dashboard Stripe correta
- [ ] endpoint aponta para o domínio correto
- [ ] endpoint usa a rota correta:
  - [ ] `/api/payments/webhooks/stripe`
- [ ] eventos mínimos configurados:
  - [ ] `checkout.session.completed`
  - [ ] `checkout.session.async_payment_succeeded`
  - [ ] `checkout.session.async_payment_failed`
  - [ ] `account.updated`
- [ ] `whsec_...` copiado e salvo no ambiente correto

---

## 4. TESTE FUNCIONAL EM MODO TEST

### 4.1 Criar checkout

- [ ] abrir uma receita paga
- [ ] iniciar checkout
- [ ] backend retorna `checkoutUrl`
- [ ] nenhuma exceção de schema ocorre
- [ ] pedido aparece em `payment_orders`

### 4.2 Verificar banco após criação do checkout

- [ ] existe linha em `payment_orders`
- [ ] `amount_cents` preenchido
- [ ] `metadata.payerEmail` preenchido
- [ ] `provider_payment_id` recebeu `session.id` após criação
- [ ] `status` inicial é `pending`

### 4.3 Completar pagamento TEST

- [ ] checkout conclui com sucesso
- [ ] Stripe entrega `checkout.session.completed`
- [ ] endpoint responde 2xx
- [ ] `payment_orders.status` vira `approved`
- [ ] `provider_event_id` é salvo
- [ ] `provider_metadata_json.lastEventId` é salvo
- [ ] linha em `payment_events` é criada
- [ ] linha em `entitlements` é criada

### 4.4 Reenvio do mesmo evento

- [ ] reenviar manualmente o mesmo evento na dashboard Stripe
- [ ] endpoint responde sem erro fatal
- [ ] **não** cria segundo entitlement equivalente
- [ ] **não** duplica grant de acesso

### 4.5 Teste de falha assíncrona

- [ ] simular `checkout.session.async_payment_failed`
- [ ] pedido muda para `failed` quando aplicável
- [ ] evento fica registrado em `payment_events`

---

## 5. VALIDAÇÃO DE ACESSO AO PRODUTO

- [ ] usuário que pagou consegue acessar a receita comprada
- [ ] usuário sem compra não recebe acesso indevido
- [ ] admin consegue ver o pagamento no painel
- [ ] admin consegue ver o status correto
- [ ] admin não vê campos críticos quebrados/undefined

---

## 6. PRÉ-LIVE — GO/NO-GO

## GO só se tudo abaixo estiver verdadeiro

- [ ] patch aplicado
- [ ] build verde
- [ ] deploy saudável
- [ ] webhook TEST funcionando
- [ ] idempotência validada
- [ ] entitlements sendo concedidos corretamente
- [ ] domínio/Vercel/Stripe canônicos confirmados
- [ ] Connect pronto para uso real

## NO-GO se qualquer um abaixo acontecer

- [ ] checkout gera 500
- [ ] webhook retorna 400/500 indevido
- [ ] `payment_orders` não atualiza status
- [ ] `entitlements` não é criado
- [ ] evento duplicado duplica grant
- [ ] endpoint está na rota errada
- [ ] env var foi aplicada no projeto errado

---

## 7. CUTOVER LIVE

### 7.1 Antes de virar LIVE

- [ ] confirmar conta Stripe LIVE correta
- [ ] confirmar chave `sk_live_...` correta
- [ ] confirmar novo `whsec_...` LIVE
- [ ] confirmar ambiente `production` no Vercel canônico

### 7.2 Depois de virar LIVE

- [ ] redeploy feito no projeto correto
- [ ] checagem rápida de rotas essenciais
- [ ] webhook LIVE ativo e saudável
- [ ] teste real controlado com valor baixo autorizado

---

## 8. TESTE REAL CONTROLADO PÓS-LIVE

- [ ] criar uma compra real controlada
- [ ] pagamento aprovado no Stripe LIVE
- [ ] `payment_orders.status = approved`
- [ ] `payment_events` registrou `eventId`
- [ ] `entitlements` foi criado
- [ ] acesso à receita foi liberado
- [ ] painel admin mostra o pagamento correto

---

## 9. ROLLBACK

### Fazer rollback imediatamente se:

- [ ] pagamentos aprovam no Stripe mas não liberam acesso
- [ ] webhook LIVE falha de forma sistemática
- [ ] pedidos ficam presos em `pending`
- [ ] grants duplicados aparecem
- [ ] projeto Vercel errado recebeu as env vars

### Ações de rollback

- [ ] restaurar `STRIPE_SECRET_KEY` anterior / ambiente anterior se aplicável
- [ ] desativar endpoint LIVE incorreto
- [ ] reverter commit do patch se necessário
- [ ] redeploy do estado estável anterior
- [ ] registrar incidente em `IMPLANTAR/03-BLOQUEIOS.md`

---

## 10. EVIDÊNCIAS QUE DEVEM SER ANEXADAS PELOS AGENTES

- [ ] URL do projeto Vercel canônico
- [ ] domínio de produção canônico
- [ ] account id Stripe da plataforma correta
- [ ] screenshot/config do webhook correto
- [ ] ids do pedido de teste
- [ ] id do evento Stripe de teste
- [ ] id do entitlement criado
- [ ] commit/PR que aplicou o patch

---

## 11. FECHAMENTO

Só marcar `TASK-001` como concluída quando:

- [ ] TEST passou
- [ ] LIVE passou
- [ ] rollback não foi necessário
- [ ] acesso foi liberado corretamente
- [ ] painel admin ficou consistente

---

**Leitura complementar:**

- `IMPLANTAR/dossies/DOSSIE-STRIPE-PROD-REAL-2026-04-06.md`
- `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
- `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
- `IMPLANTAR/patches/`

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
