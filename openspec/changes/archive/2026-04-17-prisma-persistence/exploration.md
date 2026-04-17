## Exploration: prisma-persistence

### Current State
The approved App Router/API contract already exists and is backed by domain/application handlers plus a singleton `InMemoryRuntimeStore` that implements command persistence, view queries, and group audit append/list behavior. Runtime handler wiring is centralized in `src/lib/item-command-factory.ts`, but `getItemHistory` still reaches into `runtimeStore` directly for reads. Authorization and visible-group resolution are still mock-based in `src/lib/mock/actor.ts`, and several UI pages still consume independent hard-coded mock datasets rather than runtime APIs.

### Affected Areas
- `prisma/schema.prisma` — currently empty; needs the first real PostgreSQL model set.
- `src/lib/prisma.ts` — existing Prisma client entry point for runtime repositories.
- `src/lib/item-command-factory.ts` — safest composition root to swap in Prisma-backed repositories.
- `src/lib/runtime-store.ts` — in-memory adapter to replace or keep only for tests/dev fallback.
- `src/lib/api-runtime.ts` — contains the remaining direct `runtimeStore` coupling, especially item history reads.
- `src/application/commands/*.ts` — already define the write-side repository contracts and optimistic concurrency expectations.
- `src/application/queries/views/*.ts` and `src/application/queries/projectors/*.ts` — current read side can stay contract-stable if Prisma repositories emit the same `ItemViewRecord` shape.
- `src/application/history/group-item-audit-recorder.ts` and `src/domain/history/group-item-audit.ts` — define append-only audit semantics that must persist for group updates.
- `src/lib/mock/actor.ts` — current source of actor, membership, and visible-group resolution until real auth lands.
- `tests/integration/api/app-router-runtime.test.ts` and `tests/integration/api/item-api-integration.test.ts` — current route/contract safety net; will need a Prisma-backed integration layer instead of resettable singleton state.

### Approaches
1. **Single Prisma runtime adapter** — one `PrismaRuntimeRepository` implements command, query, and audit interfaces.
   - Pros: Minimal disruption, matches the current centralized `runtimeStore` shape, fastest path to real persistence.
   - Cons: Becomes a god-adapter quickly, mixes write/read/history concerns, makes future auth and query optimization harder.
   - Effort: Medium

2. **Separated Prisma repositories behind the same handlers** — distinct Prisma command, view, history, and identity-resolution adapters composed in the factory.
   - Pros: Better architectural fit with current domain/application boundaries, clearer test seams, safer evolution toward real auth/session resolution.
   - Cons: Slightly more upfront plumbing and mapper code.
   - Effort: Medium

### Recommendation
Choose **separated Prisma repositories behind the same handlers**, but keep the public runtime swap small: introduce Prisma-backed adapters for item commands, view queries, group audit history, and membership/actor lookup, then compose them only in `src/lib/item-command-factory.ts` and the small parts of `src/lib/api-runtime.ts` that still bypass repositories. This preserves App Router and DTO contracts, keeps the UI branch isolated, and avoids turning the first real persistence layer into a long-term monolith.

Minimum functional schema for the first slice:
- `users` — stable user identity for owners, assignees, and audit actors.
- `groups` — group identity.
- `memberships` — active membership and role, used for access + assignment validation.
- `spaces` — explicit personal/group space records so current `spaceId` contract remains true.
- `items` — single table for task/event core fields, including `spaceType`, `spaceId`, `ownerId`, nullable `groupId`, `priority`, `notes`, timestamps, `versionToken`, status, and nullable temporal columns (`startAt`, `endAt`, `dueAt`, `postponedUntil`, `completedAt`, `canceledAt`) plus discriminators for `itemType` and temporal/lifecycle kind.
- `item_assignees` — join table for multi-assignment.
- `labels` + `item_labels` — reusable labels by owning scope and item-label association.
- `group_item_audit_entries` — one row per change event with actor metadata, changedAt, versionToken.
- `group_item_audit_changes` — normalized append-only change rows (or JSON payload if speed is prioritized over relational querying in v1).

Recommended migration/implementation sequence:
1. Model Prisma schema and initial migration for users/groups/memberships/spaces/items/assignees/labels/audit.
2. Add mappers between Prisma rows and existing domain `ItemRecord` / `ItemViewRecord` / `GroupItemAuditEntry` shapes.
3. Implement Prisma command repository with optimistic concurrency for group updates (`expectedVersionToken`).
4. Implement Prisma audit repository and remove direct history coupling from `api-runtime`.
5. Implement Prisma view repository that reuses existing projectors so view/API contracts stay unchanged.
6. Introduce dev seed/bootstrap data for mock users, groups, memberships, spaces, and baseline labels/items.
7. Rewire runtime composition to Prisma in production/dev runtime while leaving pure in-memory fakes in unit tests.
8. Add Prisma-backed integration tests for CRUD, views, and audit history; preserve current route contract tests.

### Risks
- `getItemHistory` is not fully abstracted today; if left untouched, history becomes the hidden in-memory leak.
- Keeping mock actor/group resolution means persistence is real but identity is still synthetic; DB memberships and mock memberships can drift unless seeded from the same constants or loaded from DB.
- View performance may degrade if the first repository loads too much and projects in memory; acceptable for MVP, but query pushdown may be needed later.
- UI pages still read `src/lib/mock/data.ts`; real persistence will not automatically make those screens real until the parallel UI branch switches data sources.
- Label reuse rules are scope-based, so schema uniqueness must differentiate personal-owner scope vs group scope carefully.

### Ready for Proposal
Yes — proceed with one primary change, `prisma-persistence`, because the persistence swap boundary is already centralized and this work is critical for functional viability. Do **not** split the first slice further unless the team also wants to replace mock auth/membership resolution now; that should remain a follow-up change so this slice can focus on real DB backing without breaking approved contracts.
