# Folder Structure

- `api/`: Vercel Serverless Functions handlers.
- `src/`:
  - `components/`: UI components (React).
  - `features/`: Business logic modules for the frontend.
  - `hooks/`: Custom React hooks.
  - `lib/`: Shared utilities and API clients (frontend-safe).
  - `pages/`: Page components.
  - `server/`: Server-only logic, repositories, and integrations (NOT imported by frontend).
  - `types/`: Shared TypeScript types.
  - `_legacy/`: Quarantined legacy code (Prisma, etc.).
- `docs/`:
  - `audit/`: Audit reports and scoring.
  - `architecture/`: High-level design docs.
  - `operations/`: Maintenance and deployment guides.
- `tests/`: Automated tests (Vitest and Playwright).
