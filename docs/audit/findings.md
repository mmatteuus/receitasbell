# Audit Findings

## Codebase Scans (git grep)

| Pattern | Found? | Location |
|---------|--------|----------|
| `prisma` | Yes | `.env.example`, `package-lock.json`, `tests/payment-service.test.ts` |
| `sheets` | Yes | `tests/payments-settings.spec.ts`, `tests/sanitize.spec.js` |
| `rb_user_email` | Yes | `tests/helpers.ts` |
| `ADMIN_API_SECRET` | Yes | `src/server/admin/auth.ts`, `src/server/admin/guards.ts`, `src/server/shared/env.ts` |
| `resolveOptionalIdentityUser` | Yes | `api/auth/logout.ts`, `api/public/ratings.ts`, `src/server/auth/guards.ts` |
| `vercel.json` | Yes | Root directory |
| `CRON_SECRET` | Yes | `src/server/shared/env.ts`, `src/server/shared/http.ts`, `docs/` |
| `mercadopago` | Yes | `api/`, `src/`, `tests/`, `vercel.json` |
| `x-signature` | Yes | `src/server/integrations/mercadopago/webhook.ts` |
| `SameSite` | Yes | `src/server/auth/sessions.ts` |

## Route Mapping

### API Handlers (/api)
- `admin/categories.ts`, `admin/payments.ts`, `admin/recipes.ts`, `admin/settings.ts`
- `auth/logout.ts`, `auth/me.ts`, `auth/request-magic-link.ts`, `auth/verify-magic-link.ts`
- `checkout/callback.ts`, `checkout/create.ts`, `checkout/webhook.ts`
- `health/live.ts`, `health/ready.ts`
- `jobs/cleanup.ts`, `jobs/consistency.ts`, `jobs/reconcile.ts`
- `me/favorites.ts`, `me/purchases.ts`, `me/shopping-list.ts`
- `public/catalog.ts`, `public/categories.ts`, `public/comments.ts`, `public/newsletter.ts`, `public/ratings.ts`
- `health.ts`, `entitlements.ts`, `router.ts`

### Vercel Config (vercel.json)
- **Rewrites**: Consistent with file structure.
- **Crons**: Consistent with job handlers.
- **Missing**: Global security headers.

## Inconsistencies / Suspicious Files
- `prisma` and `sheets` appear to be remnants of previous implementations (found mostly in tests or env examples).
- `rb_user_email` suggests client-side identity management that needs to be replaced by full server-side sessions.
- `vercel.json` lacks strict security headers (CSP, HSTS, etc.).
