# Readiness

`/api/health/ready` now separates three states:

- `ready`: all critical checks are healthy.
- `degraded`: the app can serve traffic, but a non-critical dependency is missing or running on fallback.
- `unavailable`: a critical dependency is missing or failing.

## Checks

- `env`: critical environment variables.
- `database`: access to the required Supabase tables.
- `rateLimit`: Upstash Redis availability and runtime fallback state.
- `payments`: Stripe environment completeness for checkout/connect flows.
- `email`: Resend availability.

## How to read the result

- Missing critical env vars or failed database access -> `unavailable`.
- Missing Upstash config -> `degraded`.
- Missing Stripe payment env vars -> `degraded`.
- Upstash configured but ping fails -> `unavailable`.
- Email disabled -> `degraded`.

## Operational intent

- The endpoint should tell you whether production can accept payment traffic safely.
- A degraded rate-limit backend should be visible, not silent.
- The in-memory rate-limit fallback is only a fallback for non-critical situations and is not equivalent to a durable shared limiter.

## Relevant code paths

- `api_handlers/health/ready.ts`
- `src/server/shared/rateLimit.ts`
- `src/server/integrations/supabase/client.ts`
