# Runbooks Operacionais

Guia prático para resolução de incidentes comuns na operação do Receitas Bell.

Para incidentes de pagamento e checkout, consulte tambem `docs/runbooks/payments.md`.

## 1. Falha de Webhook (Stripe)

**Sintoma**: Pagamento aprovado no Stripe mas nao atualizado no portal.
**Onde olhar**: Logs da Vercel filtrando por `/api/payments/webhooks/stripe`.
**Mitigação**:

1. Verificar no dashboard do Stripe se os webhooks estao sendo enviados com sucesso.
2. Confirmar se `STRIPE_WEBHOOK_SECRET` esta correto.
3. Se persistir, verificar conectividade com Supabase via `/api/health/ready`.
4. Confirmar se o tenant impactado está com conexão ativa (`connected`) e não em `reconnect_required`.

## 1.1 Conexao `reconnect_required` (Stripe)

**Sintoma**: Checkout retorna erro pedindo reconexão da conta.
**Onde olhar**: Painel admin de pagamentos do tenant + logs de connect callback/status.
**Mitigação**:

1. Pedir para o lojista clicar em **Reconectar Conta**.
2. Validar se após callback o status voltou para `connected`.

## 2. Falha de Login / Magic Link

**Sintoma**: Usuários não recebem e-mail ou recebem link inválido.
**Onde olhar**: Logs da Vercel filtrando por `verify_magic_link`. Sentry para erros de integração com Resend.
**Mitigação**:

1. Verificar limites da API do Resend.
2. Confirmar se a variável `APP_BASE_URL` está correta em produção.
3. Verificar se o usuario existe na base Supabase correspondente.

## 3. Erros 503 (Health Check Fail)

**Sintoma**: Endpoint `/api/health/ready` retorna `unavailable`.
**Onde olhar**: Logs da Vercel buscando por `Health Check Fail`.
**Mitigação**:

1. Verificar acesso ao Supabase.
2. Confirmar se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao corretos.
3. Verificar se as tabelas consultadas pelo readiness estao acessiveis.

## 4. Jobs não executam

**Sintoma**: Pagamentos pendentes há horas sem atualização.
**Onde olhar**: Aba **Crons** na Vercel dashboard.
**Mitigação**:

1. Verificar se a `CRON_SECRET` na Vercel coincide com a enviada no header.
2. Forçar execução manual via navegador ou Postman usando a secret.
