# Admin Auth Model

This repository now uses a narrow admin model.

## What is allowed
- Browser admin access uses a real tenant session plus CSRF for mutating requests.
- Session access is tenant-scoped. A session for tenant A cannot access tenant B.
- Bootstrapping the first tenant still uses `ADMIN_API_SECRET`, but only before any tenant exists and only through the bootstrap flow.
- In development and preview, a scoped API-key flow can be used for internal automation when the request explicitly carries tenant scope (`x-tenant-id` or `x-tenant-slug`).

## What is not allowed
- Production-wide admin bypass via `ADMIN_API_SECRET`.
- Cross-tenant admin access.
- Mutating browser requests without CSRF.

## Relevant code paths
- `src/server/admin/guards.ts`
- `src/server/admin/auth.ts`
- `api_handlers/admin/auth/session.ts`
- `api_handlers/admin/auth/bootstrap.ts`
- `src/server/security/csrf.ts`

## Operational notes
- Browser clients should rely on the frontend API client, which creates the CSRF cookie and sends the matching header.
- Internal automation should use an explicit tenant scope and should not depend on a global secret.
- If a login or bootstrap request fails with `403 CSRF validation failed`, the browser likely does not yet have the CSRF cookie/header pair.

## Validation checklist
- Session login succeeds with CSRF.
- Logout succeeds with CSRF.
- Bootstrap succeeds with CSRF and only before the first tenant exists.
- A tenant A admin session cannot read or mutate tenant B.
