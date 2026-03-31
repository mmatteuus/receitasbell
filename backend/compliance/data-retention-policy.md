# Data Retention Policy

## Objective

Define minimum retention windows for personal and operational data handled by Receitas Bell.

## Current Scope

- `auth_sessions` in Supabase: active user and admin sessions.
- Legacy Baserow tables for sessions and magic links when still configured.
- OAuth temporary states in Baserow.
- Audit and payment operational records.

## Retention Windows

- Sessions: 30 days after creation or expiration.
- Magic links / OAuth states: 24 hours after creation or expiration.
- Audit logs: 365 days, unless a longer legal retention window is required.
- Payment events and purchase records: keep according to financial/legal obligations; review with business and legal owners before deletion.

## Operational Rule

- `/api/jobs/cleanup` runs daily at `03:00` via Vercel Cron.
- The cleanup job removes legacy session, magic link and OAuth-state records when their backing tables are configured.
- Any deletion routine must record an audit event with totals removed.

## Pending Follow-Up

- Add account deletion/self-service removal flow.
- Consolidate storage so the same retention policy applies once for all modules.
