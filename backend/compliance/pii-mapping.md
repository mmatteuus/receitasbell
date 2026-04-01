# PII Mapping

## Direct Identifiers

- Email: stored in Supabase profiles/auth sessions and payment/order records.
- Session token hashes: stored in Supabase `auth_sessions`.

## Indirect Identifiers

- IP address: stored in auth session creation and operational logs when available.
- User-Agent: stored in session creation and audit context.
- Tenant slug / tenant id: operational identifier that can become personal data when combined with account records.

## Sensitive Operational Data

- Payment metadata: order ids, provider ids and webhook events.
- Audit logs: actor id, route context and administrative changes.

## Handling Rules

- Never log raw access tokens, cookie values, webhook secrets or encryption keys.
- Prefer hashed tokens and encrypted secrets at rest.
- All new error payloads must expose `request_id` instead of raw internal secrets.
