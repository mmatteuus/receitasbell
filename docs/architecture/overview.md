# Architecture Overview

## Stack Real

- **Frontend**: React + Vite + Tailwind CSS.
- **Backend**: Vercel Serverless Functions (Node.js).
- **Database**: Supabase.
- **Payments**: Stripe Checkout + Stripe Connect.
- **Auth**: Magic Link + server-side sessions.

## Core Principles

1. **Server-Side Truth**: All critical logic (payments, permissions, secrets) resides in `/api` or `src/server`.
2. **Stateless Functions**: Leveraging Vercel's serverless architecture.
3. **Supabase as Primary Store**: Structured operational data lives in PostgreSQL via Supabase.
4. **Resilience**: Structured logging, readiness checks and protected webhooks/jobs.
