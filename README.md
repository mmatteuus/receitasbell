# Receitas Bell 🦊

Sistema modular de e-commerce e gestão de receitas para múltiplos lojistas (multi-tenant), integrado ao Stripe e com banco de dados no Supabase.

## 🚀 Stack Tecnológica

- **Linguagem:** TypeScript / Node.js
- **Hospedagem:** Vercel (Edge & Cloud Functions)
- **Banco de Dados:** [Supabase](https://supabase.com) (PostgreSQL)
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
- **Integrations:** clientes otimizados para Supabase e Stripe Connect.
- **Shared:** utilitários globais de segurança, ambiente e tratamento HTTP.

## 📁 Estrutura de Rotas (Invisíveis/API)

- `api/public/*`: catálogo, receitas e newsletter (acesso livre).
- `api/auth/*`: fluxo de login e verificação de identidade.
- `api/me/*`: área logada do cliente (favoritos, compras).
- `api/admin/*`: painel administrativo do lojista.
- `api/checkout/*`: processamento de pedidos e webhooks de pagamento.
- `api/jobs/*`: tarefas automáticas (reconciliação, limpeza).

## 🔒 Segurança e Hardening

- **Assinatura de Webhooks:** validação de assinatura para notificações do Stripe.
- **CSRF Protection:** implementação Double-Submit Cookie para todos os endpoints administrativos.
- **Session Hardening:** cookies configurados com `__Host-` prefixo em produção, operando em `SameSite=Lax`.
- **Audit Trails:** todas as mutações administrativas são registradas na tabela de auditoria do Supabase.

## ✅ Qualidade e Build

- **Gate de Produção:** `npm run gate` (`lint`, `typecheck`, `build` e `test:unit`)
- **Health Check:** verifique o status da API em `/api/health`.

## 📘 Docs Complementares

- Documentação Operacional: `docs/operations/`
- Blueprint de Produção: `docs/architecture/`
