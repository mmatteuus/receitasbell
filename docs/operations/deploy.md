# Deployment Guide

## Automatic Deploy (Vercel)
- Pushing to `main` triggers a production deployment.
- Pushing to other branches triggers a preview deployment.
- Project Settings should keep `Install Command = npm ci`.
- Project Settings should keep `Build Command = npm run lint && npm run typecheck && npm run build && npm run test:unit`.
- Git-based deployments use the branch state from GitHub, not uncommitted local workspace changes.
- The reconcile cron in `vercel.json` is `0 6 * * *` (once per day at 06:00 UTC), which is compatible with Vercel Hobby.
- If the team later needs higher-frequency reconcile, that change should be paired with a move to Vercel Pro or higher.

## Pre-deployment Checklist
1. [ ] Run `npm run lint`.
2. [ ] Run `npm run typecheck`.
3. [ ] Run `npm run build`.
4. [ ] Run `npm run test:unit`.
5. [ ] Verify all `BASEROW_TABLE_*` environment variables are set in Vercel.
6. [ ] Ensure `CRON_SECRET` is configured for automated jobs.
7. [ ] Confirm the current reconcile schedule still matches the active Vercel plan before changing cron frequency.

## Rollback
- Use the Vercel dashboard to revert to a previous successful deployment if an issue occurs.
