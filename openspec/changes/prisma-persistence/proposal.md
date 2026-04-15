# Proposal: Prisma Persistence

## Intent

Make the backend operational by replacing the singleton in-memory runtime store with Prisma/Postgres persistence, without changing approved App Router or DTO contracts. This is critical now because current data disappears on restart, audit/history is not durable, and backend progress is blocked behind a non-production storage layer.

## Scope

### In Scope
- Persist users, groups, memberships, spaces, items, assignees, labels, and group audit history in Postgres via Prisma.
- Rewire runtime composition so command, query, and history paths use Prisma-backed repositories while preserving current API/resource shapes.
- Seed/mock bootstrap data for identity, memberships, and baseline spaces so parallel UI work can continue against stable contracts.

### Out of Scope
- Real authentication/session rollout.
- Replacing remaining UI-only mock screens or optimizing query performance beyond MVP needs.

## Capabilities

### New Capabilities
- `runtime-persistence`: durable backend persistence for approved item, membership, and audit flows using Prisma/Postgres.

### Modified Capabilities
- None.

## Approach

Use separated Prisma adapters for commands, views, audit history, and membership lookup, composed at the existing runtime boundary (`src/lib/item-command-factory.ts` and `src/lib/api-runtime.ts`). Keep runtime contracts stable by mapping Prisma rows back to current `ItemRecord`, `ItemViewRecord`, and audit DTO shapes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add MVP relational model and constraints |
| `src/lib/item-command-factory.ts` | Modified | Swap runtime wiring to Prisma adapters |
| `src/lib/api-runtime.ts` | Modified | Remove direct in-memory history coupling |
| `src/lib/runtime-store.ts` | Modified | Limit to tests/dev fallback only |
| `src/lib/mock/actor.ts` | Modified | Align mock identity/membership bootstrap with DB seed |
| `tests/integration/api/*` | Modified | Move integration coverage to Prisma-backed runtime |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Split-brain between mock actor resolution and persisted memberships | High | Seed DB from shared constants and treat DB as runtime truth |
| Hidden in-memory leak via history reads | High | Rework `getItemHistory` during this slice, not later |
| UI branches still reading hard-coded mocks | Medium | Keep API contracts stable and limit this change to backend wiring |

## Rollback Plan

Keep the in-memory adapter available behind composition wiring. If Prisma rollout fails, revert factory wiring to `runtime-store`, keep schema/migrations unapplied in target environments, and preserve route contracts unchanged.

## Dependencies

- Existing approved OpenSpec contracts under `openspec/specs/`
- Prisma/Postgres environment already configured for the project

## Success Criteria

- [ ] App Router item CRUD, views, and group history run against Postgres without contract changes.
- [ ] MVP data survives process restart and preserves optimistic concurrency/history behavior.
- [ ] Mock identity/bootstrap and persisted memberships stay aligned for the MVP slice.
