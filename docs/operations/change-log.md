# Change Log

## 2026-03-27
- Policy: enforce work only on `main` (no feature branches).
- Vercel SPA fallback: exclude static/runtime assets to avoid MIME/CSS issues on missing hashes.
- Admin auth: add structured, sanitized login failure logging (reason + requestId) without changing user-visible errors.
- Tests: expand `vercel.json` coverage to assert SPA fallback exclusions.
- Tests executed: `npm run gate` (pass).
- Branch cleanup: removed local tracking for `origin/claude/fix-vercel-json-O3pwV` (remote delete pending auth).
