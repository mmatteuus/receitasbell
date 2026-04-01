# Data Retention Policy

## Objective

Define minimum retention windows for personal and operational data handled by Receitas Bell.

## Current Scope

- `auth_sessions` in Supabase: active user and admin sessions.
- `magic_links` in Supabase.
- `oauth_states` in Supabase.
- Audit and payment operational records.

## Retention Windows

- Sessions: 30 days after creation or expiration.
- Magic links / OAuth states: 24 hours after creation or expiration.
- Audit logs: 365 days, unless a longer legal retention window is required.
- Payment events and purchase records: keep according to financial/legal obligations; review with business and legal owners before deletion.

## Operational Rule

- `/api/jobs/cleanup` runs daily at `03:00` via Vercel Cron.
- The cleanup job removes expired session, magic link and OAuth-state records.
- Any deletion routine must record an audit event with totals removed.

## Pending Follow-Up

- Add account deletion/self-service removal flow.
- Review retention windows with legal/business owners as payment volume grows.
