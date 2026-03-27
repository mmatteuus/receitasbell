# Readiness

`/api/health/ready` now separates three states:

- `ready`: all critical checks are healthy.
- `degraded`: the app can serve traffic, but a non-critical dependency is missing or running on fallback.
- `unavailable`: a critical dependency is missing or failing.

## Checks
- `env`: critical environment variables.
- `baserow`: access to the required Baserow tables.
- `mp`: Mercado Pago platform configuration.
- `rateLimit`: Upstash Redis availability and runtime fallback state.
- `email`: Resend availability.

## How to read the result
- Missing critical env vars, missing required Baserow tables, or missing Mercado Pago config -> `unavailable`.
- Missing Upstash config -> `degraded`.
- Upstash configured but ping fails -> `unavailable`.
- Email disabled -> `degraded`.

## Operational intent
- The endpoint should tell you whether production can accept payment traffic safely.
- A degraded rate-limit backend should be visible, not silent.
- The in-memory rate-limit fallback is only a fallback for non-critical situations and is not equivalent to a durable shared limiter.

## Relevant code paths
- `api_handlers/health/ready.ts`
- `src/server/shared/rateLimit.ts`
- `src/server/integrations/baserow/client.ts`
