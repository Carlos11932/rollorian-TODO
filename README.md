## Rollorian TODO

Minimal product-foundation bootstrap aligned with the verified Rollorian stack family: Next.js App Router, React 19, TypeScript, Tailwind 4, Prisma, Zod, ESLint, Vitest, and Playwright.

## Current scope

This repository currently provides:

- the initial architectural ADR
- a minimal App Router shell
- baseline domain/application/interface folders
- shared domain primitives for IDs, space type, item type, priority, and version token
- Prisma-ready configuration without product models yet

Domain primitives now include identity, membership, actor metadata, and personal/group space authorization policies.

Full auth infrastructure, item commands, projections, and API routes are intentionally deferred to later OpenSpec batches.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` before adding Prisma-backed runtime work.

## Important structure

- `src/app/` — App Router entrypoints
- `src/domain/` — core business primitives and domain model
- `src/application/` — commands, queries, orchestration
- `src/interfaces/` — future API and UI adapters
- `src/features/` — route-facing feature composition
- `src/lib/` — shared framework/runtime helpers
- `tests/` — future unit/integration/e2e layers
- `prisma/` — schema and persistence assets
