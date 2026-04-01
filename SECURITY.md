# Security Policy - ReceitasBell

Este documento define as diretrizes de segurança aplicadas à arquitetura do ReceitasBell.

## 1. Tratamento de Credenciais

- **Nenhuma chave secreta em repositório**: Chaves da Vercel, segredos de criptografia (`ENCRYPTION_KEY`), chaves Supabase e Stripe nunca devem ser hardcoded.
- **Validação Crítica de Ambiente**: Variáveis de ambiente sensíveis são validadas na inicialização via `validateCriticalEnv()` (presente em `src/server/shared/env.ts`). Se ausentes, a aplicação é encerrada (`throw`) em vez de falhar silenciosamente.

## 2. Pagamentos e Stripe

- **Stripe Connect**: Toda integração de tenant utiliza o fluxo OAuth do Stripe Connect, gerando `access_token` restrito por conta.
- **Isolamento de Erros**: Erros internos relacionados a integrações externas são capturados e normalizados, garantindo que o build não trave e os logs de erro não exponham payloads internos em produção.
- **Webhook Signature**: Webhooks do Stripe são validados via `stripe.webhooks.constructEvent` com segredo configurado por tenant.

## 3. Segurança do Checkout

- **Idempotência**: Todos os checkouts enviam chaves de idempotência para evitar cobranças duplicadas.
- **Auditoria de Eventos**: Logamos sucesso e falhas com contexto apropriado para rastreabilidade, sem persistir dados sensíveis dos compradores.

## 4. Política de Reporting

Em caso de descobertas de novas vulnerabilidades:

1. **Pausar Vendas**: Colocar configurações em "Maintenance Mode".
2. **Revogar Tokens**: Revogar OAuth Tokens da integração Stripe na interface do Stripe Dashboard.
3. **Reportar Imediatamente**: Entrar em contato com o admin ou criar ocorrência privada.
