# ✅ CHECKLIST EXECUÇÃO — STRIPE PRODUÇÃO 2026-04-07

## 📋 FASE 1: RESET SENHA ADMIN SUPABASE

### Pré-requisitos
- [ ] Ter acesso ao Supabase Dashboard
- [ ] Email: `admin@receitasbell.com.br`
- [ ] Nova senha pronta: `Receitasbell.com`

### Execução
- [ ] Acessar: https://supabase.com/dashboard/project/ixfwvaszmngbyxrdiaha
- [ ] Ir para: Authentication → Users
- [ ] Buscar: `admin@receitasbell.com.br`
- [ ] Clicar no usuário
- [ ] Clicar: "Reset Password"
- [ ] Inserir nova senha: `Receitasbell.com`
- [ ] Confirmar operação
- [ ] Aguardar confirmação (pode levar segundos)

### Validação
- [ ] Abrir navegador anônimo
- [ ] Ir para: https://receitasbell.mtsferreira.dev/login
- [ ] Email: `admin@receitasbell.com.br`
- [ ] Senha: `Receitasbell.com`
- [ ] Clicar "Login"
- [ ] **RESULTADO**: Conseguiu acessar o painel admin?
  - [ ] SIM → Ir para FASE 2
  - [ ] NÃO → Executar rollback no SQL Editor:
    ```sql
    UPDATE auth.users 
    SET encrypted_password = crypt('Receitasbell.com', gen_salt('bf')) 
    WHERE email = 'admin@receitasbell.com.br';
    ```

**Tempo estimado**: 10-15 minutos

---

## 🔌 FASE 2: VERIFICAR STRIPE ACCOUNT E WEBHOOK

### Pré-requisitos
- [ ] Ter acesso ao Stripe Dashboard (Live mode)
- [ ] Conta conectada: `acct_1T4JafCuHeylIIjI`

### PARTE A: Account Status
- [ ] Acessar: https://dashboard.stripe.com/login
- [ ] Fazer login
- [ ] **VERIFICAR QUE ESTÁ EM LIVE MODE** (toggle superior direito)
- [ ] Ir para: Connect → Accounts
- [ ] Procurar account: `acct_1T4JafCuHeylIIjI`
- [ ] Clicar no account
- [ ] Ir para: Settings → Account Details

#### Validações obrigatórias
- [ ] Account Status: **Complete** (não "Pending" ou "Incomplete")
- [ ] Charges Enabled: **true** ✓
- [ ] Payouts Enabled: **true** ✓
- [ ] Country: **BR**
- [ ] Currency: **BRL**

**SE ACCOUNT NÃO ESTIVER COMPLETE**:
- [ ] Clicar: "View details"
- [ ] Completar onboarding pendente
- [ ] Adicionar dados bancários se solicitado
- [ ] Salvar e aguardar aprovação Stripe (até 2h)

### PARTE B: Webhook Endpoint
- [ ] Ir para: Developers → Webhooks
- [ ] Procurar endpoint: `https://receitasbell.mtsferreira.dev/api/payments/webhook`

**SE ENDPOINT JÁ EXISTE**:
- [ ] Clicar nele
- [ ] Verificar Status: **Enabled**
- [ ] Tab "Events": verificar eventos abaixo
- [ ] Copiar "Signing secret" (começa com `whsec_...`)
- [ ] **COMPARAR COM `.env.production.local`**: devem bater

**SE ENDPOINT NÃO EXISTE**:
- [ ] Clicar: "Add endpoint"
- [ ] URL: `https://receitasbell.mtsferreira.dev/api/payments/webhook`
- [ ] Selecionar eventos:
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] charge.succeeded
  - [ ] charge.failed
  - [ ] customer.subscription.created
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] checkout.session.completed
  - [ ] checkout.session.async_payment_succeeded
  - [ ] checkout.session.async_payment_failed
- [ ] Clicar: "Save"
- [ ] Copiar "Signing secret"
- [ ] Salvar em local seguro temporariamente

### Pós-Validação
- [ ] Account Status confirmado como **Complete**
- [ ] Webhook Endpoint confirmado como **Enabled**
- [ ] Webhook Secret anotado (se criado novo)

**Tempo estimado**: 15-20 minutos

---

## 🚀 FASE 3: DEPLOY PRODUÇÃO

### Pré-requisitos
- [ ] FASE 1 concluída ✓
- [ ] FASE 2 concluída ✓
- [ ] Git com mudanças limpas

### Execução (Automática - Vercel fará a implantação)
```bash
# Verificar status do git
git status

# Se houver mudanças de documentação:
git add IMPLANTAR/*.md
git commit -m "docs: Stripe produção - implantação validada"
git push origin main
```

### Verificação
- [ ] Acessar: https://vercel.com/matdev/receitasbell/deployments
- [ ] Aguardar novo deployment iniciar
- [ ] Verificar pipeline:
  - [ ] Clone → ✓
  - [ ] Install → ✓
  - [ ] Lint → ✓
  - [ ] Typecheck → ✓
  - [ ] Build → ✓
  - [ ] Test → ✓
- [ ] **Status final**: READY ✓

**Tempo estimado**: 5-10 minutos de execução (2 min de deploy automático)

---

## 💳 FASE 4: TESTE END-TO-END

### Opção A: Pagamento Real Mínimo (Recomendado)

**Pré-requisitos**:
- [ ] Acesso à app em produção
- [ ] Cartão de crédito disponível (será cobrado)
- [ ] Receita com valor definido (ex: R$ 5-10)

**Execução**:
1. [ ] Abrir: https://receitasbell.mtsferreira.dev/t/receitasbell
2. [ ] Buscar receita com valor (ex: "Bolo de Chocolate - R$ 10")
3. [ ] Clicar: "Comprar Receita"
4. [ ] Será redirecionado para Stripe Checkout
5. [ ] Preencher informações:
   - [ ] Email: seu email (receberá recibo)
   - [ ] Card: `4242 4242 4242 4242` (teste Stripe)
   - [ ] Expiry: `12/34` (qualquer data futura)
   - [ ] CVC: `123` (qualquer número)
   - [ ] CEP: `01310-100`
6. [ ] Clicar: "Pagar"
7. [ ] Aguardar sucesso (redireciona para app)

### Opção B: Teste Seguro (Sem Cobrar)

**Execução**:
1. [ ] Seguir passos 1-5 da Opção A
2. [ ] Deixar aberta a tela de pagamento
3. [ ] **NÃO clicar "Pagar"**
4. [ ] Fechar a aba/navegador

### Validações Obrigatórias

#### Validação 1: Transação no Stripe Dashboard
```
https://dashboard.stripe.com
→ Payments
→ Procurar transação recente
  [ ] Status: Succeeded (verde ✓)
  [ ] Amount: Correto
  [ ] Currency: BRL
```

#### Validação 2: Webhook Entregue
```
https://dashboard.stripe.com
→ Developers → Webhooks
→ Clicar no endpoint: /api/payments/webhook
→ Tab "Events"
  [ ] Evento recente: checkout.session.completed
  [ ] Status da entrega: 200 OK ✓
```

#### Validação 3: Registrado no Supabase
```
Supabase Dashboard → SQL Editor
Executar:
SELECT * FROM payments 
WHERE created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC 
LIMIT 5;

Critérios:
  [ ] Último registro existe
  [ ] provider = 'stripe'
  [ ] status = 'completed'
  [ ] amount = valor pago
  [ ] currency = 'BRL'
```

#### Validação 4: Receita Acessível ao Usuário
```
- [ ] Fazer login com email usado no pagamento
- [ ] Ir para: Minha Conta → Minhas Receitas
- [ ] [ ] Receita comprada aparece na lista
- [ ] Clicar na receita → Consegue acessar o conteúdo
```

---

## 🎯 CRITÉRIOS DE ACEITE FINAL

Para considerar a implantação **SUCESSO**, todos devem estar ✓:

- [ ] Admin login funciona com `Receitasbell.com`
- [ ] Stripe Account está em status "Complete"
- [ ] Webhook endpoint está ativo e respondendo 200 OK
- [ ] Chaves LIVE estão configuradas no Vercel
- [ ] Deploy produção passou sem erros
- [ ] Pagamento de teste criou registro em `payments`
- [ ] Webhook foi entregue com sucesso em Stripe
- [ ] Receita foi liberada para o usuário logado
- [ ] Usuário consegue acessar receita comprada

---

## 📝 DOCUMENTAÇÃO PÓS-CONCLUSÃO

Após concluir TODAS as fases:

1. [ ] Copiar este checklist
2. [ ] Marcar todas as caixas como ✓
3. [ ] Anotar data e hora de conclusão: `2026-04-07 às HH:MM`
4. [ ] Anotar qualquer desvio ou problema encontrado
5. [ ] Salvar como: `IMPLANTAR/STRIPE-CONCLUSAO-2026-04-07.md`
6. [ ] Atualizar `IMPLANTAR/TAREFAS_PENDENTES.md` marcando como `[X]`

---

## 🆘 TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| Senha admin não reseta | Usar SQL direto em Supabase: `UPDATE auth.users SET encrypted_password = ...` |
| Stripe Account incompleto | Completar onboarding no Dashboard, pode levar até 2h para aprovação |
| Webhook retornando erro | Verificar logs no Vercel: `https://vercel.com/matdev/receitasbell/functions` |
| Pagamento cria erro | Verificar console Stripe para erro específico; pode ser card declined |
| Receita não aparece para usuário | Verificar tabela `entitlements` no Supabase |

---

**Checklist criado**: 2026-04-07  
**Responsável**: Executor da implantação  
**Status inicial**: PENDENTE  
**Tempo estimado total**: 45-60 minutos
