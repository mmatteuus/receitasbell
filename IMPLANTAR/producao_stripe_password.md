# Guia de Configuração de Produção - ReceitasBell

Este documento resume as configurações necessárias para colocar a aplicação em modo de produção real, conforme solicitado.

## 1. Variáveis de Ambiente (Vercel)

Certifique-se de que as seguintes chaves de **Produção** do Stripe estão configuradas no painel da Vercel:

| Variável | Valor Esperado (Produção) |
| :--- | :--- |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (Obtido ao configurar o endpoint de webhook no dashboard do Stripe) |

**Nota:** O sistema detecta automaticamente o modo "Produção" ou "Sandbox" baseado no prefixo `sk_live_` ou `sk_test_`.

## 2. Configurações no Dashboard do Stripe

1.  **Webhook:**
    *   URL: `https://seu-dominio.com/api/payments/webhooks/stripe`
    *   Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `account.updated`.
2.  **Stripe Connect:**
    *   Certifique-se de que o modo Connect está habilitado para permitir que vendedores conectem suas contas.
    *   As taxas de plataforma estão configuradas via código em 30% (`application_fee_amount`).

## 3. Fluxo de Recuperação de Senha

O fluxo foi testado e corrigido para funcionar tanto no PWA quanto na Web:
1.  Usuário solicita recuperação no Login.
2.  E-mail é enviado via Supabase Auth.
3.  Link redireciona para `/pwa/auth/update-password`.
4.  O componente `UpdatePasswordPage` utiliza o cliente Supabase para atualizar a senha e sincronizar a sessão.

## 4. Remoção do Baserow

Todas as referências ao Baserow foram removidas. O banco de dados oficial e único é o **Supabase**.

## Próximos Passos Recomendados

1.  Executar `npm run gate` localmente para garantir que não há quebras de tipos ou testes.
2.  Realizar um teste de compra real (com valor baixo) em produção para validar o repasse dos 30%.
