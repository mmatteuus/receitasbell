# Runbooks Operacionais

Guia prático para resolução de incidentes comuns na operação do Receitas Bell.

## 1. Falha de Webhook (Mercado Pago)
**Sintoma**: Pagamento aprovado no MP mas não atualizado no portal.
**Onde olhar**: Logs da Vercel filtrando por `/api/checkout/webhook`.
**Mitigação**:
1. Verificar no dashboard do Mercado Pago se os webhooks estão sendo enviados com sucesso.
2. Executar o job de reconciliação manualmente: `GET /api/jobs/reconcile?secret=${CRON_SECRET}`.
3. Se persistir, verifique a conectividade com o Baserow via `/api/health`.
4. Confirmar se o tenant impactado está com conexão ativa (`connected`) e não em `reconnect_required`.

## 1.1 Conexão `reconnect_required` (Mercado Pago)
**Sintoma**: Checkout retorna erro pedindo reconexão da conta.
**Onde olhar**: Painel admin de pagamentos do tenant + logs com `token_rejected_by_mercadopago`.
**Mitigação**:
1. Pedir para o lojista clicar em **Reconectar Conta**.
2. Validar se após callback o status voltou para `connected`.
3. Reprocessar pedidos `pending` com `GET /api/jobs/reconcile?secret=${CRON_SECRET}`.

## 1.2 Duplicidade de conexões ativas (repair)
**Sintoma**: Tenant com múltiplos registros `connected`/`reconnect_required` na tabela `MP_CONNECTIONS`.
**Mitigação**:
1. Executar `GET /api/jobs/payments/repair-connections?secret=${CRON_SECRET}`.
2. Confirmar nos logs o evento `mercadopago.connection_repaired`.
3. Validar no painel admin que apenas uma conexão ativa permaneceu.

## 2. Falha de Login / Magic Link
**Sintoma**: Usuários não recebem e-mail ou recebem link inválido.
**Onde olhar**: Logs da Vercel filtrando por `verify_magic_link`. Sentry para erros de integração com Resend.
**Mitigação**:
1. Verificar limites da API do Resend.
2. Confirmar se a variável `APP_BASE_URL` está correta em produção.
3. Verificar se o e-mail do usuário existe na tabela `Users` do Baserow.

## 3. Erros 503 (Health Check Fail)
**Sintoma**: Endpoint `/api/health` retorna `storage: false`.
**Onde olhar**: Logs da Vercel buscando por `Health Check Fail`.
**Mitigação**:
1. Verificar status da API do Baserow (status.baserow.io).
2. Confirmar se o `BASEROW_API_TOKEN` não expirou ou foi revogado.
3. Verificar se as tabelas listadas em `env.ts` ainda existem no Baserow.

## 4. Jobs não executam
**Sintoma**: Pagamentos pendentes há horas sem atualização.
**Onde olhar**: Aba **Crons** na Vercel dashboard.
**Mitigação**:
1. Verificar se a `CRON_SECRET` na Vercel coincide com a enviada no header.
2. Forçar execução manual via navegador ou Postman usando a secret.
