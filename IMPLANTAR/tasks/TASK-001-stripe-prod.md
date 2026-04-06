# TASK-001: Migrar Stripe para Modo LIVE

**ID:** TASK-001  
**Prioridade:** P0 (Crítico)  
**Status:** 🟡 VERIFICAÇÃO FINAL (95% concluído)  
**Agente:** OpenCode (validação) + Antigravity (dashboard)  
**Criado em:** 2026-04-06
**Atualizado em:** 2026-04-06 16:45 UTC

---

## 🎯 OBJETIVO

Migrar Stripe de TEST mode para LIVE mode para permitir pagamentos reais.

---

## 📋 PRÉ-REQUISITOS

- [x] Chaves LIVE já estão em .env.production.local
- [x] Webhook implementado em `/api/payments/webhook`
- [x] Sistema de checkout funcionando
- [ ] Account Stripe verificado como "Complete" (PENDENTE - Antigravity)
- [ ] Webhook endpoint ativo em Stripe Dashboard (PENDENTE - Antigravity)
- [ ] Teste de pagamento real (PENDENTE - Antigravity)

---

## 🔧 PASSOS EXATOS (Antigravity)

### 1. Acessar Dashboard Stripe

```
URL: https://dashboard.stripe.com
Login: (credenciais do owner da conta)
```

### 2. Ativar Modo LIVE

1. No dashboard, clicar no toggle "Test Mode" (canto superior direito)
2. Mudar para "Live Mode"

### 3. Gerar Novas Chaves LIVE

1. Ir para **Developers → API Keys**
2. Copiar:
   - **Publishable key** (`pk_live_...`)
   - **Secret key** (`sk_live_...`) — **CLICAR EM "Reveal live key"**

### 4. Atualizar Webhook Secret LIVE

1. Ir para **Developers → Webhooks**
2. Se webhook `https://receitasbell.mtsferreira.dev/api/payments/webhook` não existir em LIVE, criar:
   - Endpoint URL: `https://receitasbell.mtsferreira.dev/api/payments/webhook`
   - Events to send: `checkout.session.completed`, `payment_intent.succeeded`, `account.updated`
3. Copiar **Signing secret** (`whsec_...`)

### 5. Atualizar Vercel Environment Variables

1. Acessar **Vercel Dashboard → receitasbell → Settings → Environment Variables**
2. Atualizar (Production):
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. **IMPORTANTE:** Marcar **Production** e **Preview** se necessário
4. Clicar **Save**

### 6. Redeploy na Vercel

```bash
# Trigger redeploy com novas env vars
# Antigravity: acessar Vercel UI → Deployments → Redeploy (latest)
```

### 7. Validar Deploy

**Antigravity deve:**

1. Aguardar deploy concluir (status: Ready)
2. Monitorar logs Vercel por **15 minutos**
3. Verificar se há erros relacionados a Stripe

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] Stripe em LIVE mode no dashboard
- [ ] Chaves LIVE configuradas na Vercel
- [ ] Webhook LIVE recebendo eventos
- [ ] Deploy sem erros (logs Vercel limpos)
- [ ] **Smoke test:** criar checkout session e verificar webhook no Supabase

---

## 🧪 COMO VALIDAR

### Teste Manual (Antigravity)

1. Acessar: `https://receitasbell.mtsferreira.dev/t/receitasbell`
2. Selecionar uma receita
3. Clicar em "Comprar"
4. No checkout Stripe, usar **cartão de teste LIVE** (não existe, então usar cartão real com valor mínimo)
5. Verificar:
   - Pagamento processado
   - Webhook registrado em `transactions` table no Supabase
   - Receita liberada para usuário

**ATENÇÃO:** Se não quiser processar pagamento real, fazer apenas teste de criação de checkout session e verificar se chaves LIVE estão funcionando.

---

## ⚠️ RISCOS

- **Baixo:** Mudança de chaves é operação segura
- **Rollback:** Se falhar, reverter env vars para TEST keys e redeploy

---

## 🚨 SE FALHAR

1. Documentar erro exato em `IMPLANTAR/03-BLOQUEIOS.md`
2. Reverter env vars para TEST
3. Redeploy
4. Notificar Claude (atualizar este arquivo)

---

## 📊 STATUS ATUAL (2026-04-06)

### ✅ JÁ CONCLUÍDO

1. **Chaves LIVE Configuradas**
   - ✅ `STRIPE_SECRET_KEY` = `sk_live_...`
   - ✅ `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - ✅ `STRIPE_WEBHOOK_SECRET` = `whsec_...`

2. **Webhook Implementado**
   - ✅ Handler em `/src/server/payments/application/handlers/webhooks/stripe.ts`
   - ✅ Rota disponível em `/api/payments/webhook`
   - ✅ Processamento de checkout.session.completed
   - ✅ Concessão de receitas ao usuário

3. **Sistema de Pagamento**
   - ✅ Checkout funcionando
   - ✅ Metadata configurada corretamente
   - ✅ Logging de eventos implementado

### ⏳ PRÓXIMAS VALIDAÇÕES (Antigravity)

1. **Account Stripe**
   - [ ] Acessar: https://dashboard.stripe.com
   - [ ] Verificar account `acct_1T4JafCuHeylIIjI`
   - [ ] Status deve ser: "Complete"
   - [ ] Payouts enabled: ✅
   - [ ] Charges enabled: ✅

2. **Webhook Endpoint**
   - [ ] Acessar: https://dashboard.stripe.com/webhooks
   - [ ] Procurar endpoint para domínio
   - [ ] Confirmar status: "Enabled"
   - [ ] Confirmar eventos configurados

3. **Teste de Pagamento**
   - [ ] Acessar: https://receitasbell.mtsferreira.dev/t/receitasbell
   - [ ] Comprar receita com cartão `4242 4242 4242 4242`
   - [ ] Webhook deve registrar transação
   - [ ] Receita deve ser liberada

---

## 📝 AO CONCLUIR

1. Marcar `[X]` em `IMPLANTAR/01-TAREFAS-ATIVAS.md`
2. Mover esta tarefa para `IMPLANTAR/02-HISTORICO.md`
3. Atualizar `IMPLANTAR/03-BLOQUEIOS.md` (remover BLOQ-001)
4. Criar entry em histórico com data, commit SHA, evidência

---

**Análise Inicial**: MtsFerreira — [mtsferreira.dev](https://mtsferreira.dev)
**Validação Técnica**: OpenCode - 2026-04-06
**Próximas Ações**: Antigravity (validações finais)
