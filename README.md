# Receitas Bell 🦊

Sistema modular de e-commerce e gestão de receitas para múltiplos lojistas (multi-tenant), integrado ao Stripe e operado via Baserow.

## 🚀 Stack Tecnológica
- **Linguagem:** TypeScript / Node.js
- **Hospedagem:** Vercel (Edge & Cloud Functions)
- **Storage Operacional:** [Baserow](https://baserow.io) (base de dados operacional)
- **Pagamentos:** Stripe (Checkout + Connect tenant-aware)
- **Observabilidade:** Sentry + Logger Estruturado (Vercel JSON Logs)

## 🛠️ Como Rodar Localmente
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env.local` com as chaves obrigatórias.
3. Inicie o servidor de desenvolvimento: `npm run dev`

## 🏗️ Arquitetura em Alto Nível
O sistema segue uma abordagem orientada a domínios limpos em `src/server/`:
- **Auth:** Gerenciamento de sessões, Magic Links e autenticação administrativa.
- **Tenancy:** Resolução de lojista via subdomínio ou header `x-tenant-slug`.
- **Payments:** onboarding por tenant, checkout por seller e reconciliação automática.
- **Integrations:** clientes otimizados para Baserow com política de retry e timeout.
- **Shared:** utilitários globais de segurança, ambiente e tratamento HTTP.

## 📁 Estrutura de Rotas (Invisíveis/API)
- `api/public/*`: catálogo, receitas e newsletter (acesso livre).
- `api/auth/*`: fluxo de login e verificação de identidade.
- `api/me/*`: área logada do cliente (favoritos, compras).
- `api/admin/*`: painel administrativo do lojista.
- `api/checkout/*`: processamento de pedidos e webhooks de pagamento.
- `api/jobs/*`: tarefas automáticas (reconciliação, limpeza).

## 📊 Configuração do Baserow
O sistema utiliza o Baserow como storage operacional. Todos os IDs de tabelas devem ser configurados como variáveis de ambiente. Consulte `src/server/integrations/baserow/tables.ts` para a lista completa.

| Variável | Descrição |
| :--- | :--- |
| `BASEROW_API_TOKEN` | Token de API do Baserow com permissões de leitura/escrita. |
| `BASEROW_TABLE_TENANTS` | ID da tabela de lojistas. |
| `BASEROW_TABLE_SESSIONS` | ID da tabela de sessões de usuário. |
| `BASEROW_TABLE_MAGIC_LINKS` | ID da tabela de tokens magic link. |
| `BASEROW_TABLE_STRIPE_CONNECTIONS` | ID da tabela de conexões Stripe por tenant. |

## 🔒 Segurança e Hardening
- **Assinatura de Webhooks:** validação de assinatura para notificações do Stripe.
- **CSRF Protection:** implementação Double-Submit Cookie para todos os endpoints administrativos.
- **Session Hardening:** cookies configurados com `__Host-` prefixo em produção, operando em `SameSite=Lax`.
- **Audit Trails:** todas as mutações administrativas são registradas na tabela de auditoria do Baserow.

## ✅ Qualidade e Build
- **Gate de Produção:** `npm run gate` (`lint`, `typecheck`, `build` e `test:unit`)
- **Health Check:** verifique o status da API em `/api/health`.

## 📘 Docs Complementares
- Documentação Operacional: `docs/operations/`
- Blueprint de Produção: `docs/architecture/`
