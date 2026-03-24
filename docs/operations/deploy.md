# Deployment Guide

## Automatic Deploy (Vercel)
- Pushing to `main` triggers a production deployment.
- Pushing to other branches triggers a preview deployment.

## Pre-deployment Checklist
1. [ ] Run `npm run typecheck`.
2. [ ] Run `npm test`.
3. [ ] Verify all `BASEROW_TABLE_*` environment variables are set in Vercel.
4. [ ] Ensure `CRON_SECRET` is configured for automated jobs.

## Rollback
- Use the Vercel dashboard to revert to a previous successful deployment if an issue occurs.
