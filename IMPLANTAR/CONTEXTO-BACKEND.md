# CONTEXTO BACKEND - Receitas Bell

**Data**: 2026-04-06  
**Orquestrador**: Backend Agent (Claude Sonnet 4.5)  
**Desenvolvido por**: MtsFerreira - [mtsferreira.dev](https://mtsferreira.dev)

---

## 📊 ANÁLISE INICIAL COMPLETADA

### Stack Identificada
- **Frontend**: React + TypeScript + Vite
- **Backend**: Vercel Serverless Functions (TypeScript)
- **Database**: Baserow (API externa)
- **Pagamentos**: Mercado Pago (ativo) + Stripe Connect (em configuração)
- **Auth**: Supabase Auth
- **Email**: Resend
- **Cache**: Upstash Redis

### Estado Atual do Backend

✅ **FUNCIONANDO**:
- Mercado Pago conectado e operacional
- Baserow API integrada com tabelas configuradas
- Health check endpoints ativos
- Supabase Auth configurado
- Deploy Vercel automático

⚠️ **EM CONFIGURAÇÃO**:
- Stripe Connect: account conectado mas em modo TEST
- Webhooks Stripe: precisam ser configurados para produção
- Env vars: chaves TEST precisam virar LIVE

❌ **BLOQUEIOS IDENTIFICADOS**:
- Senha admin `admin@receitasbell.com.br` inacessível
- Stripe não em modo produção (bloqueio de vendas)
- Possível ausência de webhook configurado

---

## 🎯 TAREFA P0 CRIADA E DELEGADA

**Arquivo**: `IMPLANTAR/TAREFA-P0-STRIPE-PRODUCAO.md`

**Objetivos**:
1. Resetar senha admin para `Receitasbell.com`
2. Configurar Stripe Connect em modo LIVE
3. Criar webhook endpoint no Stripe Dashboard
4. Atualizar env vars no Vercel
5. Testar fluxo end-to-end de pagamento

**Responsável**: Antigravity (navegador) + OpenCode (CLI)

**Estimativa**: 45 minutos

**Status**: `[AGUARDANDO EXECUÇÃO]`

---

## 📁 ESTRUTURA CRIADA

```
IMPLANTAR/
├── TAREFA-P0-STRIPE-PRODUCAO.md  ← NOVA (tarefa detalhada)
├── CREDENCIAIS.md                 ← NOVA (credenciais padrão)
├── TAREFAS_PENDENTES.md           ← ATUALIZADA
├── CAIXA-DE-ENTRADA.md
├── CAIXA-DE-SAIDA.md
├── HISTORICO_CONCLUIDO.md
└── ...
```

---

## 🔄 PROTOCOLO DE EXECUÇÃO

### Para Agentes IA

1. **Ler tarefa completa**: `IMPLANTAR/TAREFA-P0-STRIPE-PRODUCAO.md`
2. **Executar fases sequencialmente**: Não pular etapas
3. **Validar cada fase**: Critérios de aceite explícitos
4. **Registrar problemas**: `IMPLANTAR/CAIXA-DE-ENTRADA.md`
5. **Ao concluir**: Mover para `HISTORICO_CONCLUIDO.md`
6. **Deploy**: Acompanhar logs Vercel até confirmação

### Para Você (Mateus)

**Próxima ação**:
- Abrir conversa com Antigravity
- Passar o link: `IMPLANTAR/TAREFA-P0-STRIPE-PRODUCAO.md`
- Solicitar execução da tarefa
- Antigravity vai pedir confirmação antes de cada fase crítica

**Quando Antigravity terminar**:
- Ele vai atualizar `HISTORICO_CONCLUIDO.md`
- Você valida o deploy em: `https://vercel.com/mmatteuus/receitasbell/deployments`
- Testa pagamento real no site

---

## ⚠️ PONTOS DE ATENÇÃO

### Stripe Account
- Account ID: `acct_1T4JafCuHeylIIjI`
- Status conhecido: Livemode BRL
- **Verificar**: Onboarding completo, dados bancários cadastrados

### Webhooks
- URL esperada: `https://receitasbell.mtsferreira.dev/api/payments/stripe/webhook`
- Eventos críticos: `payment_intent.succeeded`, `charge.succeeded`
- **Risco**: Se webhook não funcionar, pagamento não libera receita

### Env Vars Vercel
- `STRIPE_SECRET_KEY`: Precisa ser `sk_live_...` (não `sk_test_...`)
- `STRIPE_WEBHOOK_SECRET`: Copiar do Stripe Dashboard após criar endpoint
- **Risco**: Env vars erradas quebram todo o fluxo de pagamento

---

## 📋 PRÓXIMAS TAREFAS (pós-P0)

Após Stripe em produção:

### P1 - Auditoria de Transações
- Validar no Supabase se webhooks estão gravando
- Verificar fluxo completo: pagamento → webhook → liberação de receita
- Arquivo: `IMPLANTAR/TAREFA-P1-AUDITORIA-WEBHOOKS.md` (a criar)

### P1 - Corrigir 404 Tenant Home
- Rota quebrada: `/t/receitasbell`
- Bloqueio: Impede vendas mesmo com Stripe OK
- Responsável: OpenCode

### P2 - Limpeza de Admins
- Remover usuários admin não autorizados
- Deixar apenas `admin@receitasbell.com.br`
- SQL já está em `CREDENCIAIS.md`

---

## 💡 DECISÕES TÉCNICAS TOMADAS

1. **Password Padrão**: `Receitasbell.com`
   - Fácil de lembrar
   - Deve ser trocado após primeiro login
   - Documentado em `CREDENCIAIS.md`

2. **Stripe Connect Standard**
   - Modelo mais simples para multi-tenant
   - Dinheiro vai direto para conta do tenant
   - Plataforma não intermediar fundos

3. **Estrutura IMPLANTAR/**
   - Uma tarefa = um arquivo MD
   - Tarefas concluídas vão para `HISTORICO_CONCLUIDO.md`
   - Facilita rastreamento e contexto entre conversas

4. **Protocolo de Não-Quebra**
   - Rollback documentado em cada tarefa
   - Env vars antigas preservadas
   - Webhook pode ser desabilitado sem quebrar app

---

## 📊 MÉTRICAS DE SUCESSO

**Tarefa P0 será considerada bem-sucedida se**:

1. Login admin funciona com nova senha
2. Stripe Account está Active
3. Webhook responde 200 OK
4. Pagamento de teste cria registro no DB
5. Receita é liberada para usuário após pagamento
6. Deploy Vercel passa sem erros
7. Zero downtime durante migração

---

## 🔒 SEGURANÇA

**Arquivo `CREDENCIAIS.md`**:
- ⚠️ NUNCA commitar com senhas reais
- Senhas padrão são temporárias
- Trocar imediatamente após setup
- Usar password manager para armazenar senhas reais

**Env Vars**:
- Nunca expor no código
- Apenas em Vercel env vars (encrypted)
- Rotação a cada 90 dias

---

## 📞 PRÓXIMA AÇÃO IMEDIATA

**Para você (Mateus)**:

1. Abrir conversa com **Antigravity**
2. Enviar:
   ```
   Preciso que você execute a tarefa P0.
   Leia o arquivo completo: 
   https://github.com/mmatteuus/receitasbell/blob/main/IMPLANTAR/TAREFA-P0-STRIPE-PRODUCAO.md
   
   Execute fase por fase, validando critérios de aceite.
   Me avise antes de cada deploy.
   
   Ao concluir, atualize HISTORICO_CONCLUIDO.md
   ```

3. Acompanhar execução
4. Quando Antigravity finalizar, validar deploy
5. Testar pagamento real no site

---

**Desenvolvido por**: MtsFerreira - [mtsferreira.dev](https://mtsferreira.dev)  
**Orquestrado por**: Backend Agent (Claude Sonnet 4.5)
