# Status do Projeto: Receitas Bell 🦊 - Auditoria de Março/2026

Este documento reflete o estado auditado do repositório na `main` depois da revisão do dossiê de auditoria.

## 🏗️ Arquitetura Atual

- **Branch única:** o repositório segue operando na `main`.
- **Backend:** rotas TypeScript em `/api/` rodando no Node Runtime da Vercel.
- **Storage:** Supabase como banco principal.
- **Pagamentos:** Stripe Checkout + Stripe Connect por tenant.

## ✅ Itens Concluídos na Auditoria

- **CSP em enforcement:** `vercel.json` agora usa `Content-Security-Policy` em vez de `Report-Only`.
- **Erros padronizados:** `src/server/shared/http.ts` passou a responder erros em `application/problem+json` com `request_id` e `timestamp`.
- **Correlation ID:** todas as rotas de entrada agora propagam `x-correlation-id` e `x-request-id`.
- **Retenção básica:** o job de cleanup remove estados OAuth antigos, links magicos e sessoes expiradas.
- **Supply chain:** workflow de segurança dedicado e Actions fixadas por SHA.
- **Higiene do repositório:** arquivos de debug removidos e ignorados.
- **Schema Supabase:** movido da raiz para `docs/architecture/supabase_hardened_schema.sql`.
- **Legado removido:** integracoes e mencoes operacionais antigas foram retiradas do codigo ativo.

## 🔎 Pendências Reais Após a Auditoria

- **Quota e credenciais externas:** deploy e scans remotos dependem de autenticação/configuração da Vercel e do GitHub Actions com secrets reais.
- **Observabilidade funcional:** Sentry e alertas ainda dependem de configuração no ambiente e não apenas no código.
- **Build quota/deploy remoto:** depende de autenticação e disponibilidade da Vercel no ambiente executor.

## 🚀 Estado do Deploy

- **Vercel:** pronto para deploy a partir da `main`.
- **CI:** pipeline principal continua validando lint, typecheck, build e testes unitários; pipeline de segurança passou a gerar SBOM e rodar secret/dependency scan.
