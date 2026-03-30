# TASK-008 — Provisionar tabelas e variáveis para OAuth social
- **Objetivo:** habilitar o backend social com uma feature flag e tabelas Baserow específicas.
- **Arquivos-alvo:** `.env.example`, `src/server/shared/env.ts`, e documentação em `IMPLANTAR/status/`.
- **Passos**
  1. Adicionar ao `.env.example` e ao parser `env.ts` as variáveis:
     - `AUTH_SOCIAL_ENABLED`
     - `AUTH_SOCIAL_ALLOWED_TENANTS`
     - `GOOGLE_OAUTH_CLIENT_ID`
     - `GOOGLE_OAUTH_CLIENT_SECRET`
     - `GOOGLE_OAUTH_REDIRECT_URI`
     - `BASEROW_TABLE_AUTH_OAUTH_STATES`
     - `BASEROW_TABLE_USER_IDENTITIES`
  2. Criar/validar as tabelas Baserow:
     - `auth_oauth_states` (hash de state, redirect_to, expires_at, status, metadata).
     - `user_identities_social` (tenant, user, provider, provider_subject, email_verified, timestamps, status).
  3. Registrar os IDs das tabelas e as variáveis adicionadas em `IMPLANTAR/status/execution-log.md`.
- **Outputs esperados**
  - Atualização no `.env.example` e no parser `env.ts`.
  - Documento com IDs das tabelas e explicação da feature flag.
  - Log com confirmação que as tabelas existem e estão acessíveis pelo token.
- **Após concluir:** delete este arquivo e toque TASK-009.
