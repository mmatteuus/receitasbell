# Status do Projeto: Receitasbell 🦊 - Hardening & Consolidação (Março/2026)

Este documento serve como a "Fonte da Verdade" para o estado atual do projeto após a execução do plano de limpeza e profissionalização da infraestrutura. Use este contexto ao iniciar novas conversas.

## 🏗️ Arquitetura Atual (ESM & Multi-tenant)
- **Unificação:** Todas as branches foram fundidas na `main`. Código legado foi movido para `src/_legacy`.
- **Backend:** Rotas puras em TypeScript no `/api/`, seguindo os padrões do Vercel Node Runtime.
- **Banco de Dados:** Multi-tenant via **Baserow**. Todos os repositórios em `src/server/` usam o cliente consolidado (`fetchBaserow`).
- **Segurança:** 
  - CSRF: Double-Submit Cookie implementado em todos os endpoints administrativos.
  - Sessões: Hardened cookies com prefixo `__Host-` em produção.
  - Webhooks: Validação HMAC-SHA256 para Mercado Pago.

## 📁 Principais Alterações em Infraestrutura
- **`src/server/integrations/baserow/`:** Cliente e tabelas centralizados. IDs agora são lidos de forma rigorosa via `env.ts`.
- **`src/server/shared/env.ts`:** Validação Zod completa para TODAS as variáveis de ambiente necessárias.
- **`src/server/audit/`:** Nova camada de auditoria que registra todas as ações de administradores no Baserow.
- **`api/health.ts`:** Novo endpoint para verificação de disponibilidade (`/api/health`).

## 📊 Mapeamento de Tabelas Baserow (Database ID: 399490)
As seguintes variáveis de ambiente foram configuradas na Vercel com estes IDs:
| Tabela | ID | Tabela | ID |
| :--- | :--- | :--- | :--- |
| `Tenants` | 896975 | `Sessions` | 897407 |
| `Users` | 896984 | `MagicLinks` | 900630 |
| `Recipes` | 896978 | `AuditLogs` | 897425 |
| `Payments`| 896979 | `Purchases` | 896992 |

## 🚀 Pendências e Próximos Passos
1. **Redeploy na Vercel:** Os builds estão travados por cota excedida (12m/12m gastos). É necessário aguardar o reset ou adquirir minutos adicionais para que o código pushado comece a rodar.
2. **Hardening de Frontend:** Revisar se as chamadas de API do admin já incluem o header `x-csrf-token`.
3. **Limpeza Legada:** Analisar se os arquivos em `src/_legacy` podem ser deletados definitivamente após validação das novas rotas.

---
*Contexto gerado para agilizar o setup de novas sessões de IA.*
