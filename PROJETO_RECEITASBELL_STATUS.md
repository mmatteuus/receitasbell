# Status do Projeto: Receitasbell 🦊 - Supabase & Stripe (Março/2026)

Este documento serve como a "Fonte da Verdade" para o estado atual do projeto após a migração completa para Supabase e Stripe.

## 🏗️ Arquitetura Atual
- **Unificação:** O repositório foi unificado no ramo `main`. Ramos legados foram removidos.
- **Backend:** Rotas puras em TypeScript no `/api/`, integradas ao Vercel Node Runtime.
- **Banco de Dados:** **Supabase (PostgreSQL)**. Toda a persistência de dados (Receitas, Usuários, Sessões, etc.) foi migrada do Baserow para tabelas nativas do Supabase.
- **Pagamentos:** **Stripe**. O fluxo de checkout e webhooks agora utiliza exclusivamente o Stripe, substituindo o Mercado Pago.

## 📁 Principais Camadas
- **`src/server/integrations/supabase/`:** Cliente e lógica de acesso ao banco de dados Supabase.
- **`src/server/integrations/stripe/`:** Integração com a API do Stripe para pagamentos e subscrições.
- **`api_handlers/`:** Handlers de rota consolidados. Entradas legadas `/api_handlers/payments` (Mercado Pago) foram removidas.
- **`src/server/shared/env.ts`:** Validação de variáveis de ambiente (Supabase tokens, Stripe keys, etc.) via Zod.

## 🚀 Estado do Deploy
- **Vercel:** O projeto está configurado para deploy automático a partir do ramo `main`.
- **Limpeza:** Códigos e scripts relacionados ao Baserow e Mercado Pago foram completamente eliminados para evitar erros de build e conflitos de dependência.

---
*Contexto atualizado para refletir a nova infraestrutura de produção.*
