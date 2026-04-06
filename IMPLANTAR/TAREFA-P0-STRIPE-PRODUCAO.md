# TAREFA P0: Stripe Connect Produção + Reset Senha Admin

**STATUS**: `[PENDENTE]`
**PRIORIDADE**: P0 (CRÍTICO - BLOQUEIO DE VENDAS)
**RESPONSÁVEL**: Antigravity / OpenCode
**ESTIMATIVA**: 45 minutos
**ÚLTIMA ATUALIZAÇÃO**: 2026-04-06

---

## 🎯 OBJETIVO

Configurar Stripe Connect para **modo produção** com account conectado real + resetar senha do admin para permitir auditoria financeira.

## 🔍 CONTEXTO

Com base na análise do backend:
- Stripe está configurado mas em modo TEST
- Account conectado atual: `acct_1T4JafCuHeylIIjI` (livemode BRL confirmado)
- Senha do admin `admin@receitasbell.com.br` está inacessível
- Necessário trocar para `Receitasbell.com` como senha padrão

## ⚠️ RISCOS IDENTIFICADOS

1. **Account Stripe pode estar incompleto** (onboarding não finalizado)
2. **Webhooks podem não estar configurados** para modo produção
3. **Chaves SK/PK podem estar em test mode** no Vercel
4. **Reset de senha pode invalidar sessões ativas**

---

## 📋 PASSO A PASSO DETALHADO

### FASE 1: Reset Senha Admin (15min)

**AGENTE**: Antigravity

**AÇÃO 1.1 - Acessar Supabase Admin**
1. Abrir navegador em: `https://supabase.com/dashboard/project/[PROJECT_ID]`
2. Login com credenciais do projeto
3. Navegar: `Authentication` → `Users`

**AÇÃO 1.2 - Localizar usuário admin**
1. Buscar: `admin@receitasbell.com.br`
2. Clicar no email para abrir detalhes
3. Ir em tab `User Management`

**AÇÃO 1.3 - Resetar senha**
1. Clicar `Reset Password`
2. Gerar nova senha: `Receitasbell.com`
3. Copiar e salvar temporariamente
4. Confirmar reset

**AÇÃO 1.4 - Validar acesso**
1. Abrir aba anônima
2. Ir para: `https://receitasbell.mtsferreira.dev/login`
3. Tentar login:
   - Email: `admin@receitasbell.com.br`
   - Senha: `Receitasbell.com`
4. **CRITÉRIO DE ACEITE**: Login com sucesso, acesso ao painel admin

**ROLLBACK SE FALHAR**:
```bash
# Se login falhar, executar SQL direto no Supabase SQL Editor:
UPDATE auth.users 
SET encrypted_password = crypt('Receitasbell.com', gen_salt('bf')) 
WHERE email = 'admin@receitasbell.com.br';
```

---

### FASE 2: Verificar Stripe Account (15min)

**AGENTE**: Antigravity

**AÇÃO 2.1 - Login no Stripe Dashboard**
1. Abrir: `https://dashboard.stripe.com/login`
2. Login com conta conectada ao projeto
3. Verificar se está em **LIVE MODE** (toggle superior direito)

**AÇÃO 2.2 - Validar Account Conectado**
1. Ir para: `Connect` → `Accounts`
2. Procurar account: `acct_1T4JafCuHeylIIjI`
3. Verificar:
   - [ ] Status: `Active` ou `Complete`
   - [ ] Payouts enabled: `true`
   - [ ] Charges enabled: `true`
   - [ ] Country: `BR`
   - [ ] Currency: `BRL`

**SE ACCOUNT NÃO ESTIVER COMPLETE**:
- Clicar em `View details`
- Completar onboarding pendente
- Adicionar dados bancários se necessário
- Salvar e aguardar aprovação Stripe (pode levar até 2h)

**AÇÃO 2.3 - Verificar Webhook Endpoint**
1. Ir para: `Developers` → `Webhooks`
2. Procurar endpoint para: `https://receitasbell.mtsferreira.dev/api/payments/stripe/webhook`
3. **SE NÃO EXISTIR**:
   - Clicar `Add endpoint`
   - URL: `https://receitasbell.mtsferreira.dev/api/payments/stripe/webhook`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.succeeded`
     - `charge.failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Salvar
4. **COPIAR WEBHOOK SECRET** (começa com `whsec_...`)

---

### FASE 3: Atualizar Env Vars no Vercel (10min)

**AGENTE**: Antigravity OU OpenCode (via CLI)

**AÇÃO 3.1 - Obter Chaves Produção**
1. No Stripe Dashboard → `Developers` → `API Keys`
2. **GARANTIR QUE ESTÁ EM LIVE MODE**
3. Copiar:
   - `Secret key` (começa com `sk_live_...`)
   - `Publishable key` (começa com `pk_live_...`)

**AÇÃO 3.2 - Atualizar Vercel**

**OPÇÃO A - Via Dashboard** (Antigravity):
1. Abrir: `https://vercel.com/mmatteuus/receitasbell/settings/environment-variables`
2. Editar variáveis:
   - `STRIPE_SECRET_KEY` → `sk_live_...` (valor da Fase 3.1)
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (valor da Fase 2.3)
3. Escopo: `Production`, `Preview`, `Development`
4. Salvar

**OPÇÃO B - Via CLI** (OpenCode):
```bash
# Atualizar env var no Vercel
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# Quando pedir valor, colar: sk_live_...

vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# Quando pedir valor, colar: whsec_...
```

**AÇÃO 3.3 - Redeploy Produção**
```bash
vercel --prod
```

**AÇÃO 3.4 - Aguardar Deploy**
1. Acompanhar logs em: `https://vercel.com/mmatteuus/receitasbell/deployments`
2. **CRITÉRIO DE ACEITE**: Build passa sem erros, deploy completo
3. Se falhar: verificar logs, corrigir, repetir

---

### FASE 4: Teste End-to-End (5min)

**AGENTE**: Antigravity

**AÇÃO 4.1 - Criar Pagamento de Teste**
1. Abrir: `https://receitasbell.mtsferreira.dev/t/receitasbell`
2. Escolher uma receita paga
3. Clicar `Comprar Receita`
4. Preencher dados de teste:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - CEP: `01310-100`
5. Confirmar pagamento

**AÇÃO 4.2 - Validar Webhook**
1. Ir para Stripe Dashboard → `Developers` → `Webhooks`
2. Clicar no endpoint criado
3. Tab `Events` → verificar evento recente
4. **CRITÉRIO DE ACEITE**: Status `200 OK`

**AÇÃO 4.3 - Validar no Supabase**
1. Abrir Supabase SQL Editor
2. Executar:
```sql
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 5;
```
3. **CRITÉRIO DE ACEITE**: Último pagamento aparece com `provider=stripe` e `status=completed`

---

## ✅ CRITÉRIOS DE ACEITE FINAL

- [ ] Login admin funciona com senha `Receitasbell.com`
- [ ] Stripe Account `acct_1T4JafCuHeylIIjI` está Active
- [ ] Webhook configurado e respondendo 200 OK
- [ ] Env vars atualizadas com chaves LIVE no Vercel
- [ ] Deploy produção passou sem erros
- [ ] Pagamento de teste criou registro no Supabase
- [ ] Receita foi liberada para o usuário após pagamento

---

## 🔄 PROTOCOLO DE REVERSÃO

SE ALGO QUEBRAR:

1. **Reverter env vars no Vercel**:
   - Voltar para chaves TEST antigas
   - Redeploy

2. **Desabilitar webhook temporariamente**:
   - Stripe Dashboard → Webhooks → Disable endpoint

3. **Notificar no IMPLANTAR/CAIXA-DE-ENTRADA.md**:
```markdown
## ROLLBACK EXECUTADO - [Data/Hora]

**Motivo**: [Descrever o que deu errado]
**Ação tomada**: Voltou para modo TEST
**Próximos passos**: [O que precisa ser corrigido]
```

---

## 📝 APÓS CONCLUSÃO

**AGENTE EXECUTOR DEVE**:

1. Mover este arquivo para: `IMPLANTAR/HISTORICO_CONCLUIDO.md`
2. Adicionar seção:

```markdown
## ✅ TAREFA P0 CONCLUÍDA - 2026-04-06

**Agente**: [Nome]
**Duração**: [Tempo real gasto]
**Resultado**:
- [x] Admin login OK
- [x] Stripe Connect em produção
- [x] Webhook funcionando
- [x] Teste E2E passou

**Observações**: [Qualquer desvio do planejado]

**Link de evidência**: [URL do deploy Vercel]
```

3. Atualizar `IMPLANTAR/TAREFAS_PENDENTES.md`:
   - Marcar como `[X]` a linha da tarefa Stripe

---

## 📞 CONTATOS DE EMERGÊNCIA

**Se encontrar bloqueio técnico**:
- Stripe Support: `https://support.stripe.com/contact`
- Vercel Support: Dashboard → Help
- Supabase Support: Dashboard → Support

**Se precisar de decisão de negócio**:
- Registrar em `IMPLANTAR/CAIXA-DE-ENTRADA.md` com tag `[AGUARDANDO MATEUS]`

---

**Orquestrado por**: Backend Agent (Claude Sonnet 4.5)
**Desenvolvido por**: MtsFerreira - [mtsferreira.dev](https://mtsferreira.dev)
