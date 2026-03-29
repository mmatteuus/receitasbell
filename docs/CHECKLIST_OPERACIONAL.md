# Checklist Operacional - Integração Mercado Pago

Este checklist cobre as ações manuais (via Navegador) que devem ser feitas no **Baserow** e **Vercel** para que o código da auditoria funcione perfeitamente.

## 1. Atualizações Manuais no Baserow (P0)

> "Sempre que for precisar mexer no baserow você vai utilizar o navegador."

O código agora espera alguns campos adicionais e validados. Acesse seu banco do Baserow no navegador e realize as edições abaixo de forma **aditiva**.

### Tabela `mercado_pago_connections` (ou nome equivalente)
Adicione as seguintes colunas de **texto (Single line text)** ou **data (Date)** se elas ainda não existirem:
- [ ] `mercado_pago_user_id` (tipo texto)
- [ ] `access_token_encrypted` (tipo texto)
- [ ] `refresh_token_encrypted` (tipo texto)
- [ ] `status` (tipo texto)
- [ ] `last_error` (tipo texto)
- [ ] `created_by_user_id` (tipo texto)
- [ ] `connected_at` (tipo Date ou texto caso preferir ISO iso-8601)
- [ ] `disconnected_at` (tipo Date ou texto)
- [ ] `last_refresh_at` (tipo Date ou texto)

*Nota: Presenvar `tenant_id`, `user_id`, `public_key`, `access_token` originais para não quebrar a lógica antiga que faz fallback.*

### Tabela `Payment_Orders` (ou nome equivalente)
Para capturar de forma correta se o cliente pagou no crédito ou débito (TASK-005), adicione:
- [ ] `provider_payment_method_id` (Single line text)
- [ ] `provider_payment_type_id` (Single line text)

---

## 2. Atualizações Manuais na Vercel (P0)

> "Sempre que for precisar mexer na vercel você vai utilizar o navegador."

O código agora trava o build de forma proposital se as variáveis de tabela crítica estiverem faltando. O helper `validateCriticalEnv()` agora valida essas chaves.

Adicione as seguintes variáveis na interface da Vercel (aba Settings > Environment Variables):
- [ ] `BASEROW_TABLE_PAYMENT_ORDERS=` (ID da sua tabela de pagamentos)
- [ ] `BASEROW_TABLE_MP_CONNECTIONS=` (ID da sua tabela de conexões OAuth do Mercado Pago)
- [ ] `BASEROW_TABLE_OAUTH_STATES=` (ID da sua tabela de estados OAuth)
- [ ] `MP_DISABLE_CHECKOUT_PRO=true` (Opcional: Mas no código nós já removemos o checkout_pro como `supportedMethods` fixo).

---

## 3. Validação Final (Deploy)

- Abra um PR ou faça Push da branch Main.
- Aguarde o build da Vercel (o erro `TS2724 - Stripe.StripeError` está corrigido e não deve mais ocorrer).
- Verifique os logs de serverless na rede para ter certeza que `validateCriticalEnv` não derrubou a Inicialização por falta das IDs de tabela configuradas no passo 2 acima.
