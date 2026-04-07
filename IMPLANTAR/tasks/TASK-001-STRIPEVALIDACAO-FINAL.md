# TASK-001: Stripe Live — Validação Final Executiva

**Status**: 🟡 PRONTO PARA EXECUÇÃO  
**Prioridade**: P0 (CRÍTICO)  
**Criado em**: 2026-04-07  
**Executor Designado**: Antigravity  

---

## 🎯 OBJETIVO FINAL

Validar que Stripe está operacional em **LIVE MODE** e colocar sistema em produção com pagamentos reais.

**Status Atual**: Chaves LIVE já estão configuradas. Webhook implementado. Faltam validações finais no Dashboard.

---

## ✅ O QUE JÁ ESTÁ FEITO (Code)

| Item | Status | Evidência |
|------|--------|-----------|
| Chaves LIVE | ✅ | `sk_live_*`, `pk_live_*` em `.env.production.local` |
| Webhook Handler | ✅ | `/src/server/payments/application/handlers/webhooks/stripe.ts` (296 linhas, completo) |
| Webhook Route | ✅ | `/api/payments/webhook` + aliases configurados em `router.ts` |
| Idempotência | ✅ | Implementada com `payment_events` table |
| Entitlements | ✅ | Receitas concedidas automaticamente ao usuário após pagamento |
| Error Handling | ✅ | Logging estruturado com contexto de transação |
| Env Validation | ✅ | `STRIPE_WEBHOOK_SECRET` validado no `.env.ts` |

---

## 🚨 O QUE PRECISA SER FEITO (Dashboard Stripe)

### PASSO 1: Verificar Account Status

**Onde**: https://dashboard.stripe.com (LIVE MODE)

1. Clicar em **"Settings"** → **"Account Details"** (rodapé)
2. Procurar **Account ID**: `acct_1T4JafCuHeylIIjI`
3. Verificar status:
   - ✅ "Account Status" = **Complete** (não "Incomplete")
   - ✅ "Charges Enabled" = **Yes**
   - ✅ "Payouts Enabled" = **Yes**

**Se estiver "Incomplete":**
- Completar onboarding: dados bancários, documentos, verificação

**Evidência esperada**: Screenshot da página "Account Details" com ✅ completo

---

### PASSO 2: Validar Webhook Endpoint

**Onde**: https://dashboard.stripe.com/webhooks (LIVE MODE)

1. Clicar em **"Webhooks"** (lateral esquerda)
2. Procurar por endpoint: `https://receitasbell.mtsferreira.dev/api/payments/webhook`
3. Se existir:
   - Verificar **Status**: Enabled ✅
   - Verificar **Events**: Devem incluir:
     - `checkout.session.completed` ✅
     - `checkout.session.async_payment_succeeded` ✅
     - `checkout.session.async_payment_failed` ✅
     - `account.updated` ✅ (se usar Connect)
   - Clicar em endpoint → **"Signing secret"** → copiar `whsec_...`
     - Comparar com `STRIPE_WEBHOOK_SECRET` em `.env.production.local`
     - Devem ser idênticos

4. Se **NÃO existir**:
   - Clicar **"+ Add endpoint"**
   - URL: `https://receitasbell.mtsferreira.dev/api/payments/webhook`
   - Events: selecionar acima
   - Criar e copiar signing secret para `.env`

**Evidência esperada**: Screenshot mostrando webhook ativo com eventos corretos

---

### PASSO 3: Teste de Pagamento Real (ou Simulado)

**Opção A: Teste Seguro (recomendado)**

1. Ir para: `https://receitasbell.mtsferreira.dev/t/receitasbell`
2. Selecionar uma receita paga
3. Clicar **"Comprar"** → Checkout Stripe abre
4. **Usar cartão de teste válido** (não usar cartão real):
   - Stripe fornece cartões de teste: `4242 4242 4242 4242`
   - **MAS em LIVE MODE, cartões de teste são rejeitados**
   - **Alternativa**: Usar cartão real com valor mínimo (ex: R$ 1,99)
   - Ou solicitar ao Antigravity usar seu próprio cartão para teste

5. Validar após transação:
   - ✅ Stripe Dashboard → `Payments` → transação aparece com status `Succeeded`
   - ✅ Stripe Dashboard → `Webhooks` → evento `checkout.session.completed` com status `200` (delivered)
   - ✅ Supabase → `payment_orders` table → registro com `status = 'approved'`
   - ✅ Supabase → `entitlements` table → receita concedida ao usuário
   - ✅ App → usuário consegue acessar receita comprada

**Opção B: Teste Sem Pagamento (se não quiser cobrar)**

1. Ir para: `https://receitasbell.mtsferreira.dev/t/receitasbell`
2. Selecionar receita paga
3. Clicar **"Comprar"**
4. No Stripe Checkout, **fechar ababa** (não completar)
5. Verificar em Stripe Dashboard:
   - ✅ Session criada com status `open`
   - ✅ Webhook **não** deve disparar (esperado — falta pagamento)

---

## 📋 CHECKLIST FINAL (Antigravity)

- [ ] Acessou Stripe Dashboard em LIVE MODE (não Test Mode)
- [ ] Verificou Account `acct_1T4JafCuHeylIIjI` = Complete
- [ ] Verificou Charges & Payouts = Enabled
- [ ] Verificou Webhook endpoint = Ativo em LIVE
- [ ] Webhook secret bate com `.env.production.local`
- [ ] Executou teste de pagamento (real ou fechado na metade)
- [ ] Validou eventos no Stripe Dashboard (webhook entregue, status 200)
- [ ] Validou dados no Supabase (payment_order approved, entitlements criada)
- [ ] Validou app (usuário acessa receita comprada)

---

## 🔧 Troubleshooting

### "Webhook endpoint não recebeu evento"

**Causa provável**: Webhook secret mismatch ou endpoint não ativo

**Solução**:
1. Stripe Dashboard → Webhooks → endpoint específico
2. Copiar signing secret (`whsec_...`)
3. Atualizar em `.env.production.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. **Redeploy Vercel** (novas env vars)
5. Retentar pagamento

### "Evento foi entregue mas não processou (webhook 500)"

**Causa provável**: Erro no código do webhook ou falta de contexto

**Solução**:
1. Vercel → projeto → Functions → `api/payments/webhook`
2. Ver logs (últimos 15 min)
3. Procurar `stripe.webhook.*` logs
4. Corrigir erro reportado
5. Retentar manualmente em Stripe Dashboard → Webhooks → endpoint → "Send test webhook"

### "Transação criada mas receita não concedida"

**Causa provável**: `tenantId` ou `userId` faltando em metadata

**Solução**:
1. Supabase → `payment_orders` → procurar transaction_id
2. Verificar `user_id` e `tenant_id` estão preenchidos
3. Verificar se receita `recipe_id` é válida em `recipes` table
4. Se dados corretos, disparo webhook manualmente em Stripe

---

## 📊 Após Conclusão

1. **Documentar resultado**:
   - Criar entry em `IMPLANTAR/02-HISTORICO.md`
   - Data, transação de teste, evidências
   - Status final: ✅ LIVE

2. **Mover tarefa**:
   - Remover de `IMPLANTAR/01-TAREFAS-ATIVAS.md`
   - Remover bloqueio em `IMPLANTAR/03-BLOQUEIOS.md`

3. **Comunicar ao time**:
   - Stripe live, pronto para vender receitas reais

---

## 🎬 Próximas Ações após Validação

- ✅ Monitoring de pagamentos em produção
- ✅ Alertas automáticos se webhook falhar
- ✅ Dashboard de vendas (relatórios)
- ✅ Suporte a reembolsos

---

**Preparado por**: Antigravity (executor)  
**Data de preparo**: 2026-04-07  
**Referência**: `meu_guia.md` — Padrão Operacional Mestre

