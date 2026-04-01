# Deployment Guide

## Automatic Deploy (Vercel)

- Pushing to `main` triggers a production deployment.
- Pushing to other branches triggers a preview deployment.
- Project Settings should keep `Install Command = npm ci`.
- Project Settings should keep `Build Command = npm run lint && npm run typecheck && npm run build && npm run test:unit`.
- Git-based deployments use the branch state from GitHub, not uncommitted local workspace changes.
- The cleanup cron in `vercel.json` is `0 3 * * *` (once per day).

## Pre-deployment Checklist

1. [ ] Run `npm run lint`.
2. [ ] Run `npm run typecheck`.
3. [ ] Run `npm run build`.
4. [ ] Run `npm run test:unit`.
5. [ ] Verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` in Vercel.
6. [ ] Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
7. [ ] Ensure `CRON_SECRET` is configured for automated jobs.

## Rollback

- Use the Vercel dashboard to revert to a previous successful deployment if an issue occurs.
