# Environment Variables Documentation

## Core

- `NODE_ENV`: `production` ou `development`.
- `APP_BASE_URL`: base publica usada em links, redirects e callbacks.
- `ADMIN_API_SECRET`: segredo de bootstrap administrativo.
- `CRON_SECRET`: segredo aceito por `/api/jobs/*`.
- `APP_COOKIE_SECRET`: segredo de assinatura de cookies.
- `ENCRYPTION_KEY`: chave base64 de 32 bytes para dados cifrados.

## Supabase

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Social Auth

- `AUTH_SOCIAL_ENABLED`
- `AUTH_SOCIAL_ALLOWED_TENANTS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

## Email

- `RESEND_API_KEY`
- `EMAIL_FROM`

## Rate Limit / Readiness

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Observability

- `SENTRY_DSN`

## Frontend Flags

- `VITE_ENABLE_INTERNET_FALLBACK`

Se o Upstash nao estiver configurado, o readiness pode reportar `degraded` e o rate limit cai para memoria em cenarios nao criticos.
