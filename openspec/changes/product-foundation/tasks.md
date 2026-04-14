# Tasks: Product Foundation

## Phase 1: Infrastructure

- [x] 1.1 Create `docs/adr/0001-stack-and-skeleton.md` selecting runtime, persistence, API style, test runner, and command set for the six design boundaries.
- [x] 1.2 Create root bootstrap files from the ADR and baseline folders: `README.md`, `.gitignore`, `.editorconfig`, `src/domain/`, `src/application/`, `src/interfaces/`, `tests/`.
- [x] 1.3 Add `src/domain/shared/` value objects for ids, `space_type`, `item_type`, priority, and version token primitives used across commands and queries.
- [x] 1.4 Add `src/domain/identity/` and `src/domain/access/` models for users, groups, memberships, and personal/group authorization policies.

## Phase 2: Implementation

- [x] 2.1 Add `src/domain/item/` entity + invariant policy enforcing task/event temporal rules, lifecycle states, and completion/cancel semantics.
- [x] 2.2 Add `src/domain/item/assignment-policy` and `src/domain/item/label-policy` to validate zero/one/many assignees, owner-or-member constraints, and scope-reusable labels.
- [x] 2.3 Add write-side command handlers in `src/application/commands/` for create, update, and read-by-id with optimistic version checks on shared items.
- [ ] 2.4 Add append-only audit recording in `src/domain/history/` and `src/application/history/` for group-item changes to status, assignees, priority, labels, dates, title, completion, and cancellation.
- [ ] 2.5 Add synchronous projectors in `src/application/queries/projectors/` that derive persisted/queryable facts for visibility, dated span, undated state, assignee summary, and attention reasons.
- [ ] 2.6 Add query handlers in `src/application/queries/views/` for My View, Group View, Calendar, Undated, and Requires Attention using the shared eligibility rules from spec.
- [ ] 2.7 Add API contracts in `src/interfaces/api/items/` and `src/interfaces/api/views/` for `POST/GET/PATCH /items`, `/views/*`, filters, conflict errors, and `/items/{id}/history`.

## Phase 3: Testing

- [ ] 3.1 Add unit tests in `tests/unit/item/` for undated task validity, date-less event rejection, lifecycle rules, priority enum, and assignee/member validation.
- [ ] 3.2 Add unit tests in `tests/unit/queries/` for My View inclusion/exclusion, calendar overlap, completed-event visibility, undated exclusion, and deterministic attention thresholds.
- [ ] 3.3 Add integration tests in `tests/integration/commands/` for membership-based edit authority, assignment not changing access, audit append on group edits, and optimistic concurrency conflicts.
- [ ] 3.4 Add API/integration tests in `tests/integration/api/` covering CRUD validation, stable item shape for task/event, view endpoints, filters, and history retrieval parity for agents.

## Phase 4: Later / Non-MVP

- [ ] 4.1 After API stability, add `src/interfaces/ui/` adapters that consume the same query/view contracts without changing domain or projection rules.
