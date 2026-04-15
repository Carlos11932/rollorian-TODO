# Tasks: Prisma Persistence

## Phase 1: Infrastructure

- [x] 1.1 Expand `prisma/schema.prisma` with `User`, `Group`, `Membership`, `Space`, `Item`, `ItemAssignee`, `Label`, `ItemLabel`, `GroupAuditEntry`, and `GroupAuditChange`, including scope uniqueness and item/version constraints.
- [x] 1.2 Create the first migration in `prisma/migrations/*` and verify it encodes membership FKs, scoped label reuse, append-only audit tables, and item-to-space ownership rules.
- [x] 1.3 Create shared Prisma runtime types and aggregate queries under `src/interfaces/persistence/prisma/` for item rows, joined assignees/labels, memberships, and audit change rows.

## Phase 2: Bootstrap and Repository Foundations

- [x] 2.1 Extract shared mock identity/bootstrap constants from `src/lib/mock/actor.ts` into a reusable source consumed by both `src/lib/mock/actor.ts` and new `prisma/seed.ts`.
- [ ] 2.2 Create `prisma/seed.ts` to seed users, groups, memberships, spaces, scoped labels, and minimal sample items so runtime membership truth lives in Postgres.
- [ ] 2.3 Add mapper modules in `src/interfaces/persistence/prisma/` that translate Prisma aggregates to `ItemRecord`, `ItemViewRecord`, and `GroupItemAuditEntry` without changing DTO contracts.
- [ ] 2.4 Implement `PrismaItemCommandRepository` in `src/interfaces/persistence/prisma/` with `findById`, `save`, item version checks, member-only group assignees, and scoped label reuse.
- [ ] 2.5 Implement `PrismaGroupItemHistoryRepository` in `src/interfaces/persistence/prisma/` for ordered audit append/read so history survives restarts.
- [ ] 2.6 Implement `PrismaMembershipResolver` in `src/interfaces/persistence/prisma/` so visible groups, memberships, and command-space hydration come from persisted memberships.
- [ ] 2.7 Implement `PrismaItemViewRepository` in `src/interfaces/persistence/prisma/` to load visible item aggregates for existing query projectors and view filters.

## Phase 3: Runtime Wiring

- [ ] 3.1 Update `src/lib/item-command-factory.ts` to compose Prisma command, view, audit, and membership adapters as the default production runtime.
- [ ] 3.2 Refactor `src/lib/api-runtime.ts` to stop reading `runtimeStore` for `findById`, list/view queries, and history; resolve actor access through the Prisma membership resolver.
- [ ] 3.3 Update `src/lib/mock/actor.ts` to keep header-based actor selection but defer visible groups, memberships, and command-space truth to Prisma-backed lookups.

## Phase 4: Verification and Cleanup

- [ ] 4.1 Replace in-memory API harness coverage in `tests/integration/api/item-api-integration.test.ts` with Prisma-backed integration scenarios for CRUD, concurrency, non-member assignment rejection, label reuse, and persisted history.
- [ ] 4.2 Update `tests/integration/api/app-router-runtime.test.ts` to run App Router contract checks against seeded Prisma data, including restart-safe history and unassigned group visibility.
- [ ] 4.3 Add mapper/repository tests under `tests/unit/` or `tests/integration/` for audit reconstruction, membership reachability across groups, and scoped-label normalization.
- [ ] 4.4 Demote `src/lib/runtime-store.ts` to test/fallback-only usage, keep `resetRuntimeStore()` isolated to non-production paths, and remove production exports that bypass Prisma.
