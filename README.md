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

The repository now includes session-backed human APIs, an agent platform with issued credentials, and an MCP server that talks to the Agent API over HTTP.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` before adding Prisma-backed runtime work.

## Build and validation

```bash
npm run lint:strict
npm run typecheck
npm run test:run
npm run build
```

Apply schema changes separately when needed:

```bash
npm run prisma:migrate
```

## Agent Platform

Management API protected by the signed-in session:

- `GET /api/agent-clients`
- `POST /api/agent-clients`
- `POST /api/agent-clients/[agentClientId]/credentials`
- `POST /api/agent-clients/[agentClientId]/credentials/[credentialId]/revoke`
- `POST /api/agent-clients/[agentClientId]/revoke`

Agent API protected by bearer token:

- `GET /api/agent/v1/items`
- `POST /api/agent/v1/items`
- `GET /api/agent/v1/items/[id]`
- `PATCH /api/agent/v1/items/[id]`
- `GET /api/agent/v1/items/[id]/history`
- `GET /api/agent/v1/views/my`
- `GET /api/agent/v1/views/attention`
- `GET /api/agent/v1/views/calendar`
- `GET /api/agent/v1/views/undated`
- `GET /api/agent/v1/views/groups/[groupId]`

Related docs:

- [docs/agent-platform.md](/C:/Users/Carlo/Desktop/proyectos/rollorian-todo-agent-platform-v1/docs/agent-platform.md)
- [contracts/agent/README.md](/C:/Users/Carlo/Desktop/proyectos/rollorian-todo-agent-platform-v1/contracts/agent/README.md)

## Important structure

- `src/app/` — App Router entrypoints
- `src/domain/` — core business primitives and domain model
- `src/application/` — commands, queries, orchestration
- `src/interfaces/` — future API and UI adapters
- `src/features/` — route-facing feature composition
- `src/lib/` — shared framework/runtime helpers
- `tests/` — future unit/integration/e2e layers
- `prisma/` — schema and persistence assets
