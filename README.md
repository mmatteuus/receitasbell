# Receitas Bell 🦊

Sistema modular de e-commerce e gestão de receitas para múltiplos lojistas (multi-tenant), integrado ao Mercado Pago e operado via Baserow.

## 🚀 Stack Tecnológica
- **Linguagem:** TypeScript / Node.js
- **Hospedagem:** Vercel (Edge & Cloud Functions)
- **Storage Operacional:** [Baserow](https://baserow.io) (Base de dados low-code)
- **Pagamentos:** Mercado Pago (Platform OAuth + Checkout Pro)
- **Observabilidade:** Sentry + Logger Estruturado (Vercel JSON Logs)

## 🛠️ Como Rodar Localmente
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env.local` com as chaves obrigatórias.
3. Inicie o servidor de desenvolvimento: `npm run dev`

## 🏗️ Arquitetura em Alto Nível
O sistema segue uma abordagem orientada a domínios limpos em `src/server/`:
- **Auth:** Gerenciamento de sessões, Magic Links e autenticação administrativa.
- **Tenancy:** Resolução de lojista via subdomínio ou header `x-tenant-slug`.
- **Payments:** Integração resiliente com Mercado Pago e reconciliação automática.
- **Integrations:** Clientes otimizados para Baserow com política de retry e timeout.
- **Shared:** Utilitários globais de segurança, ambiente e tratamento HTTP.

## 📁 Estrutura de Rotas (Invisíveis/API)
- `api/public/*`: Catálogo, receitas e newsletter (acesso livre).
- `api/auth/*`: Fluxo de login e verificação de identidade.
- `api/me/*`: Área logada do cliente (favoritos, compras).
- `api/admin/*`: Painel administrativo do lojista.
- `api/checkout/*`: Processamento de pedidos e webhooks de pagamento.
- `api/jobs/*`: Tarefas automáticas (reconciliação, limpeza).

## 📊 Baserow como Banco de Dados
O Baserow é usado como storage operacional. Todos os IDs de tabelas devem ser configurados como variáveis de ambiente no formato `BASEROW_TABLE_[NOME]`. Consultar `src/server/integrations/baserow/tables.ts` para o mapeamento técnico.

## ✅ Qualidade e Build
- **Build:** `npm run build`
- **Typecheck:** `npm run typecheck`
- **Testes Unitários:** `npm run test:unit`

## 📘 Docs Complementares
- Documentação Operacional: `docs/operations/`
- Blueprint de Produção: `docs/architecture/`
