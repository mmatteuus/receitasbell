# Receitas Bell 🦊

Sistema modular de e-commerce e gestão de receitas para múltiplos lojistas (multi-tenant), integrado ao Mercado Pago e operado via Baserow.

## 🚀 Stack Tecnológica
- **Linguagem:** TypeScript / Node.js
- **Hospedagem:** Vercel (Edge & Cloud Functions)
- **Storage Operacional:** [Baserow](https://baserow.io) (Base de dados low-code)
- **Pagamentos:** Mercado Pago (Platform OAuth + Checkout Pro tenant-aware)
- **Observabilidade:** Sentry + Logger Estruturado (Vercel JSON Logs)

## 🛠️ Como Rodar Localmente
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env.local` com as chaves obrigatórias.
3. Inicie o servidor de desenvolvimento: `npm run dev`

## 🏗️ Arquitetura em Alto Nível
O sistema segue uma abordagem orientada a domínios limpos em `src/server/`:
- **Auth:** Gerenciamento de sessões, Magic Links e autenticação administrativa.
- **Tenancy:** Resolução de lojista via subdomínio ou header `x-tenant-slug`.
- **Payments:** OAuth por tenant, checkout por seller e reconciliação automática.
- **Integrations:** Clientes otimizados para Baserow com política de retry e timeout.
- **Shared:** Utilitários globais de segurança, ambiente e tratamento HTTP.

## 📁 Estrutura de Rotas (Invisíveis/API)
- `api/public/*`: Catálogo, receitas e newsletter (acesso livre).
- `api/auth/*`: Fluxo de login e verificação de identidade.
- `api/me/*`: Área logada do cliente (favoritos, compras).
- `api/admin/*`: Painel administrativo do lojista.
- `api/checkout/*`: Processamento de pedidos e webhooks de pagamento.
- `api/jobs/*`: Tarefas automáticas (reconciliação, limpeza).

## 📊 Configura\u00e7\u00e3o do Baserow
O sistema utiliza o Baserow como storage operacional. Todos os IDs de tabelas devem ser configurados como vari\u00e1veis de ambiente. Consulte `src/server/integrations/baserow/tables.ts` para a lista completa.

| Vari\u00e1vel | Descri\u00e7\u00e3o |
| :--- | :--- |
| `BASEROW_API_TOKEN` | Token de API do Baserow com permiss\u00f5es de leitura/escrita. |
| `BASEROW_TABLE_TENANTS` | ID da tabela de lojistas. |
| `BASEROW_TABLE_SESSIONS` | ID da tabela de sess\u00f5es de usu\u00e1rio. |
| `BASEROW_TABLE_MAGIC_LINKS` | ID da tabela de tokens magic link. |
| `BASEROW_TABLE_MP_CONNECTIONS` | ID da tabela de conex\u00f5es OAuth do Mercado Pago por tenant. |

## 🔒 Seguran\u00e7a e Hardening
- **Assinatura de Webhooks:** Valida\u00e7\u00e3o HMAC-SHA256 para notifica\u00e7\u00f5es do Mercado Pago.
- **CSRF Protection:** Implementa\u00e7\u00e3o Double-Submit Cookie para todos os endpoints administrativos.
- **Session Hardening:** Cookies configurados com `__Host-` prefixo em produ\u00e7\u00e3o, operando em HSL Lax para m\u00e1xima seguran\u00e7a.
- **Audit Trails:** Todas as muta\u00e7\u00f5es administrativas s\u00e3o registradas na tabela de auditoria do Baserow.

## ✅ Qualidade e Build
- **Gate de Produção:** `npm run gate` (`lint`, `typecheck`, `build` e `test:unit`)
- **Health Check:** Verifique o status da API em `/api/health`.

## 📘 Docs Complementares
- Documenta\u00e7\u00e3o Operacional: `docs/operations/`
- Blueprint de Produ\u00e7\u00e3o: `docs/architecture/`
