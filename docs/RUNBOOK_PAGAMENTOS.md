# Runbook Operacional - Manutenção e Recuperação (Mercado Pago / ReceitasBell)

## 1. Monitoramento Básico (Sinais de Falha)
1. **Picos de Falha no Obtenção do Catálogo:** Se subitamente os clientes só virem a opção Pix no checkout (ausência repentina de Cartões), o sistema fez mock/fallback de falha ao comunicar com o MP ou o token expirou (O código assume suporte mínimo se a API de PaymentMethods falhar).
2. **Rejeição contínua em Preferências:** Se pagamentos geram rejeição do MP (401/403) contínua as verificações OAuth do tenant podem ter sido irremediavelmente revogadas.

---

## 2. Ação Imediata de Bloqueio

Sempre que atuar em resposta a um incidente crítico:
1. Revogar no Dashboard Administrativo do provedor Externo M.P. as credenciais vazadas ou suspeitas.
2. Inspecione log do servidor via navegação no ambiente de deploy (Vercel) para a ocorrência `checkout.preference_failed`.

---

## 3. Re-estabelecendo Acesso do Vendedor

Caso o token (`mp_access_token` ou `reconnect_required`) esteja sendo persistentemente reportado como expirado / bloqueado pelo sistema:
1. **Reset pelo Banco**: Marque o status da conta do Seller (Tenant MP Connection correspondente) no Baserow manualmente como "disconnected".
2. **Limpe access_token**: Limpe o text field (`access_token_encrypted`) no Baserow para forçar que a aplicação solicite o "Conectar com Mercado Pago" ao vendedor nas configurações da Dashboard dele.
3. Se o código for alterado para lidar com re-roteamento automático, isso pode não ser necessário, contudo o Seller necessitará de relogar.

---

## 4. O Sistema "Trava o Build" com TS2724 no Deploy?
**R:** A vulnerabilidade de cast direto para o tipo StripeError que impedia as builds da API e Frontend foi resolvida a nível de repositório (`normalizeStripeError` / `src/server/integrations/stripe/client.ts`). Retornar atrás resultará em build failure imediato.

---

## 5. Como o Checkout_Pro pode Reativar Acidentalmente
**R:** O Checkout_Pro está desabilitado na aplicação por padrão, oferecendo Pix e Cartão (débito/crédito) transparentemente (`getCheckoutPaymentConfig` restringe "supportedMethods"). Se o layout mudar via feature-flag, certifique-se de não retornar `"checkout_pro"` na source list caso deseje manter restrição de bloqueio a boletos limitando inadimplência.
