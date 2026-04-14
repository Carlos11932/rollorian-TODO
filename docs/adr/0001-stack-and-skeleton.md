# ADR 0001: Stack and Skeleton

## Status

Accepted — 2026-04-14

## Context

- `rollorian-TODO` starts as an empty repository with only OpenSpec artifacts.
- The change `product-foundation` requires the first real bootstrap batch without over-implementing auth, memberships, item commands, queries, or UI visuals.
- The user explicitly requires `rollorian-TODO` to stay in the same stack family and architectural direction as `rollorian-books` / `rollorian-oura`.
- The reference stack was VERIFIED from code and config, not prose:
  - `rollorian-books/package.json` → Next `16.2.0`, React `19.2.4`, Prisma `7.5.0`, Tailwind `4`, Zod `4`, ESLint `9`, Vitest `4`, Playwright `1.58`
  - `rollorian-books/tsconfig.json` → strict TypeScript, `moduleResolution: bundler`, alias `@/*`
  - `rollorian-books/next.config.ts` → App Router-oriented Next config with `reactCompiler: true`
  - `rollorian-books/postcss.config.mjs` → Tailwind 4 PostCSS plugin
  - `rollorian-books/prisma.config.ts` → Prisma config loading `.env.local`

## Decision

`rollorian-TODO` SHALL use the same verified stack family and project shape baseline:

- **Runtime / framework**: Next.js 16 App Router with React 19, server-first by default
- **Language**: TypeScript 5 with strict compiler settings
- **Styling**: Tailwind CSS 4
- **Validation**: Zod 4 at input boundaries
- **Persistence direction**: Prisma 7 with PostgreSQL-compatible datasource configuration
- **Linting**: ESLint 9 with Next.js core-web-vitals + TypeScript presets
- **Testing baseline**: Vitest for unit/integration and Playwright for E2E, even if tests land in later batches
- **Package manager / command surface**: npm-compatible scripts, matching the reference repo style

## Skeleton Decision

The initial repository skeleton SHALL use `src/` boundaries aligned to the design document:

- `src/domain/` — core business primitives, entities, policies
- `src/application/` — commands, queries, orchestration
- `src/interfaces/` — API/UI adapters and transport contracts
- `src/features/` — route-facing feature composition and UI modules
- `src/lib/` — framework/shared runtime helpers
- `src/app/` — Next.js App Router entrypoints only
- `tests/` — unit, integration, e2e layers
- `prisma/` — schema and future persistence assets

This keeps the backend direction explicit while allowing a parallel frontend workflow to start from a real App Router shell.

## API Style

- External surface SHALL be App Router route handlers under `src/app/api/` when API work starts.
- Contracts SHALL remain CRUD/query oriented, matching the OpenSpec design (`/items`, `/views/*`, `/items/{id}/history`).
- Domain rules SHALL stay outside route handlers.

## Boundary Mapping

| Design boundary | Initial home |
|---|---|
| Identity / Membership | `src/domain/identity/`, `src/application/identity/`, `src/interfaces/api/identity/` |
| Space Access | `src/domain/access/`, `src/application/access/` |
| Item Domain | `src/domain/item/` |
| Labels / Assignment | `src/domain/item/`, `src/application/commands/` |
| History | `src/domain/history/`, `src/application/history/` |
| Query / API | `src/application/queries/`, `src/interfaces/api/`, `src/app/api/` |

## Command Set

- `npm run dev` — local Next.js development server
- `npm run build` — production build validation
- `npm run start` — serve built app
- `npm run lint` — repository linting
- `npm run lint:strict` — stricter source-only linting
- `npm run typecheck` — TypeScript no-emit verification
- `npm run test` — Vitest watch mode
- `npm run test:run` — Vitest single run
- `npm run test:coverage` — Vitest coverage
- `npm run test:e2e` — Playwright end-to-end suite
- `npm run prisma:generate` — Prisma client generation

## Consequences

### Positive

- Frontend and backend can evolve in parallel on a shared, verified foundation.
- The project stays aligned with the real Rollorian stack instead of stale assumptions.
- Domain/application/interface boundaries are explicit from day one.

### Tradeoffs

- This bootstrap intentionally ships more config than current functionality.
- Prisma and test tooling are present before full backend or test implementation exists.

## Non-Goals For This Batch

- No auth implementation
- No membership or access policies yet
- No item aggregate or commands yet
- No query projections or route handlers yet
- No visual polish beyond a placeholder shell
