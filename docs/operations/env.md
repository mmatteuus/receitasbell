# Environment Variables Documentation

## Core Variables
- `NODE_ENV`: `production` or `development`.
- `APP_BASE_URL`: Full URL of the application (e.g., `https://receitasbell.com.br`).
- `CRON_SECRET`: Random string for authenticating Vercel Cron Jobs.

## Storage (Baserow)
- `BASEROW_API_URL`: URL of the Baserow instance (e.g., `https://api.baserow.io`).
- `BASEROW_API_TOKEN`: Your Baserow API token.

### Table IDs
All required table IDs must be provided as strings.
- `BASEROW_TABLE_TENANTS`
- `BASEROW_TABLE_USERS`
- `BASEROW_TABLE_TENANT_USERS`
- `BASEROW_TABLE_RECIPES`
- `BASEROW_TABLE_CATEGORIES`
- `BASEROW_TABLE_SETTINGS`
- `BASEROW_TABLE_PAYMENT_ORDERS`
- `BASEROW_TABLE_PAYMENT_EVENTS`
- `BASEROW_TABLE_SESSIONS`
- `BASEROW_TABLE_MAGIC_LINKS`

## Email (Resend)
- `RESEND_API_KEY`: Resend API key for sending emails.
- `EMAIL_FROM`: The FROM email address.

## Mercado Pago (10/10)
- `MP_WEBHOOK_SECRET`: Secret for verifying webhook HMAC signatures.
- `MP_APP_CLIENT_ID`: Mercado Pago App Client ID for OAuth.
- `MP_APP_CLIENT_SECRET`: Mercado Pago App Client Secret for OAuth.
- `MP_APP_REDIRECT_URI`: Registered redirect URI for OAuth.

## Security
- `APP_COOKIE_SECRET`: Key for signing cookies and sensitive data.
- `APP_ENCRYPTION_KEY`: Key for server-side field encryption.
