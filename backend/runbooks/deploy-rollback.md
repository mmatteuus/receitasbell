# Deploy and Rollback

## Deploy

1. Run `npm run gate` locally.
2. Ensure required Vercel environment variables are configured.
3. Push to `main`.
4. Trigger production deploy with `vercel --prod` when manual deploy is needed.
5. Validate `/api/health` and a critical payment/auth path after deployment.

## Rollback

1. Identify the last healthy Vercel deployment.
2. Run `vercel rollback <deployment-url>` or revert the offending commit on `main`.
3. Re-run smoke validation after rollback.

## Minimum Post-Deploy Checks

- `Content-Security-Policy` header present.
- `x-correlation-id` present on API responses.
- `/api/jobs/cleanup` authorized execution still works.
