# Environment Variables Documentation

## Core
- `NODE_ENV`: `production` or `development`.
- `APP_BASE_URL`: Public base URL of the app (for callbacks and links).
- `ADMIN_API_SECRET`: Bootstrap secret for first-run admin setup. In production it is not a global admin bypass.
- `CRON_SECRET`: Secret used by `/api/jobs/*`.
- `APP_COOKIE_SECRET`: Cookie signing secret.
- `ENCRYPTION_KEY`: Base64 value for a 32-byte key (AES-256-GCM for encrypted fields at rest).

## Storage (Baserow)
- `BASEROW_API_URL`
- `BASEROW_API_TOKEN`
- `BASEROW_TIMEOUT_MS`: Optional timeout for Baserow requests in milliseconds.

### Required table IDs
- `BASEROW_TABLE_TENANTS`
- `BASEROW_TABLE_USERS`
- `BASEROW_TABLE_TENANT_USERS`
- `BASEROW_TABLE_RECIPES`
- `BASEROW_TABLE_CATEGORIES`
- `BASEROW_TABLE_SETTINGS`
- `BASEROW_TABLE_PAYMENT_ORDERS`
- `BASEROW_TABLE_PAYMENT_EVENTS`
- `BASEROW_TABLE_RECIPE_PURCHASES`
- `BASEROW_TABLE_AUDIT_LOGS`
- `BASEROW_TABLE_SESSIONS`
- `BASEROW_TABLE_MAGIC_LINKS`

### Optional table IDs
- `BASEROW_TABLE_OAUTH_STATES`
- `BASEROW_TABLE_MP_CONNECTIONS` (required to persist Mercado Pago OAuth seller connections safely)
- `BASEROW_TABLE_FAVORITES`
- `BASEROW_TABLE_COMMENTS`
- `BASEROW_TABLE_RATINGS`
- `BASEROW_TABLE_SHOPPING_LIST`
- `BASEROW_TABLE_NEWSLETTER`

## Mercado Pago
- `MERCADO_PAGO_CLIENT_ID`: OAuth app Client ID (platform-level).
- `MERCADO_PAGO_CLIENT_SECRET`: OAuth app Client Secret (platform-level).
- `MERCADO_PAGO_REDIRECT_URI`: Optional explicit OAuth callback URL.
- `MERCADO_PAGO_WEBHOOK_SECRET`: Preferred webhook secret env.
- `MP_WEBHOOK_SECRET`: Legacy alias for webhook secret.

O fluxo operacional de checkout seller-aware usa exclusivamente conexões OAuth por tenant persistidas em `MP_CONNECTIONS`.

## Rate limit / readiness
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If Upstash is missing, readiness can report `degraded` and rate limiting can fall back to in-memory only for non-critical environments.

## Email
- `RESEND_API_KEY`
- `EMAIL_FROM`
