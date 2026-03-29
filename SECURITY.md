# Security Policy - ReceitasBell

Este documento define as diretrizes de segurança aplicadas à arquitetura do ReceitasBell, com foco especial na integração com o Mercado Pago e proteção de acessos.

## 1. Tratamento de Credenciais

- **Nenhuma chave secreta em repositório**: Tokens do Baserow (`BASEROW_API_TOKEN`), chaves da Vercel e segredos de criptografia (`ENCRYPTION_KEY`) nunca devem ser hardcoded.
- **Validação Crítica de Ambiente**: Variáveis de ambiente sensíveis e as variáveis de tabelas relacionadas a pagamentos são validadas na inicialização via `validateCriticalEnv()` (presente em `src/server/shared/env.ts`). Se ausentes, a aplicação é encerrada (`throw`) em vez de falhar silenciosamente no meio da execução.

## 2. Pagamentos e Mercado Pago

- **OAuth 2.0**: Toda integração utiliza o fluxo OAuth do Mercado Pago, gerando `access_token` e `refresh_token` restritos.
- **Isolamento de Erros**: Erros internos relacionados a integrações externas (Stripe, Mercado Pago) são capturados e normalizados, garantindo que o build não trave e os logs de erro não exponham o payload interno em produção.
- **Expiração Rígida**: O status de conexão valida rigidamente o `expires_at` do token e a existência de um `refresh_token` válido, negando transações se ambos expirarem, resultando no status `reconnect_required`.

## 3. Segurança do Checkout

- **Restrição de Meios de Pagamento**: O `checkout_pro` foi desativado em produção para forçar o checkout transparente de PIX e cartão, evitando que os compradores exponham tickets e boletos ao tentar burlar o fluxo interno e atrasar integrações síncronas.
- **Idempotência**: Todos os checkouts enviam chaves de idempotência ao Mercado Pago formadas por IDs randômicos em fluxos novos.
- **Auditoria de Eventos**: Logamos sucesso (e falhas de repasses de prefência) com contexto apropriado para rastreabilidade em caso de problemas massivos de recusa, sem persistir os dados sensíveis dos devedores.

## 4. Política de Reporting

Em caso de descobertas de novas vulnerabilidades (exemplo: vazamento de link estático de PIX):
1. **Pausar Vendas**: As Vercel Edge Configs devem ser colocadas em "Maintenance Mode".
2. **Revogar Tokens**: Revogar OAuth Tokens da integração na interface do Mercado Pago para o Tenant afetado.
3. **Reportar Imediatamente**: Entrar em contato com [E-mail do Admin] ou criar ocorrência privada.
