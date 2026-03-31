# Environment Variables Documentation

## Core

- `NODE_ENV`: `production` or `development`.
- `APP_BASE_URL`: public base URL used in callbacks and links.
- `ADMIN_API_SECRET`: bootstrap secret for the first admin session.
- `CRON_SECRET`: secret accepted by `/api/jobs/*`.
- `APP_COOKIE_SECRET`: cookie signing/encryption secret.
- `ENCRYPTION_KEY`: base64 value for a 32-byte key.

## Baserow

Legacy and operational modules still depend on Baserow.

- `BASEROW_API_URL`
- `BASEROW_API_TOKEN`
- `BASEROW_TIMEOUT_MS`
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
- `BASEROW_TABLE_OAUTH_STATES`
- `BASEROW_TABLE_STRIPE_CONNECTIONS`
- `BASEROW_TABLE_STRIPE_OAUTH_STATES`
- `BASEROW_TABLE_FAVORITES`
- `BASEROW_TABLE_COMMENTS`
- `BASEROW_TABLE_RATINGS`
- `BASEROW_TABLE_SHOPPING_LIST`
- `BASEROW_TABLE_NEWSLETTER`

## Supabase

Auth and profile persistence already run on Supabase.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Stripe Connect

- `STRIPE_CLIENT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_REDIRECT_URI`
- `STRIPE_WEBHOOK_SECRET`

## Social Auth

- `AUTH_SOCIAL_ENABLED`
- `AUTH_SOCIAL_ALLOWED_TENANTS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `BASEROW_TABLE_AUTH_OAUTH_STATES`
- `BASEROW_TABLE_USER_IDENTITIES`

## Email

- `RESEND_API_KEY`
- `EMAIL_FROM`

## Rate Limit / Readiness

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If Upstash is missing, readiness can report `degraded` and rate limiting falls back to in-memory mode outside critical production paths.
