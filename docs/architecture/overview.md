# Architecture Overview

## Stack Real
- **Frontend**: React + Vite + Tailwind CSS.
- **Backend**: Vercel Serverless Functions (Node.js).
- **Database**: Baserow (API-driven).
- **Payments**: Mercado Pago (Checkout Pro).
- **Auth**: Magic Link + Server-side Sessions (Baserow backend).

## Core Principles
1. **Server-Side Truth**: All critical logic (payments, permissions, secrets) resides in `/api` or `src/server`.
2. **Stateless Functions**: Leveraging Vercel's serverless architecture.
3. **Baserow as Backend**: Using Baserow tables for structured data and lightweight persistence.
4. **Resilience**: Implemented timeouts, retries, and structured logging.
