# Implantacao - Pacote para agente

## Objetivo

Implantar o app Receitas Bell na Vercel com banco no Supabase e integracoes (Stripe/Resend/Upstash/Sentry).

## Contexto rapido

- Stack: Vite + React + Node 20, hospedagem Vercel.
- Backend via rotas serverless em `api/` e `api_handlers/`.
- Health check: `/api/health` e `/api/health/ready`.

## Configuracao Vercel

- `vercel.json` define headers, rewrites e cron `0 3 * * *` para `/api/jobs/cleanup`.
- Build command em `vercel.json`: `npm run gate`.
- Install command em `vercel.json`: `npm install`.
- `docs/operations/deploy.md` recomenda `npm ci` no Project Settings (confirmar se deve sobrescrever).
- Push em `main` -> deploy de producao, outras branches -> preview.

## Supabase

- Migracao principal: executar `docs/architecture/supabase_migration.sql` no SQL Editor.
- Alternativa hardened (RLS): `docs/architecture/supabase_hardened_schema.sql` (nao usada por padrao).
- Seed default: cria tenant `receitasbell` se nao existir.

## Variaveis de ambiente (baseado em `.env.example` e `docs/operations/env.md`)

- Core: `NODE_ENV`, `APP_BASE_URL`, `ADMIN_API_SECRET`, `CRON_SECRET`, `APP_COOKIE_SECRET`, `ENCRYPTION_KEY`.
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Observability: `SENTRY_DSN`.
- Auth social: `AUTH_SOCIAL_ENABLED`, `AUTH_SOCIAL_ALLOWED_TENANTS`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`.
- Email: `RESEND_API_KEY`, `EMAIL_FROM`.
- Rate limit: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Frontend flag: `VITE_ENABLE_INTERNET_FALLBACK`.

## Perguntas em aberto

1. Qual ambiente alvo (prod ou preview) e qual projeto/conta Vercel?
2. Qual dominio final para definir `APP_BASE_URL`?
3. Ja existe projeto Supabase? (URL + anon/service role keys)
4. Stripe em modo test ou prod? (secret key + webhook secret)
5. Resend: API key e email remetente (`EMAIL_FROM`)?
6. Upstash: sera configurado ou aceitar `degraded` no readiness?
7. Sentry DSN sera usado?
8. Social auth vai ser ativado? (credenciais Google)
9. Confirmar se deve rodar a migracao SQL agora ou se o schema ja existe.

## Arquivos de referencia

- `README.md`
- `docs/operations/deploy.md`
- `docs/operations/env.md`
- `vercel.json`
- `.env.example`
- `docs/architecture/supabase_migration.sql`
