# Runtime Persistence Specification

## Purpose

Define the first durable persistence slice for approved runtime item, membership, and history behavior without changing caller-facing contracts.

## Requirements

### Requirement: Durable Runtime Contract Preservation

The system MUST persist approved runtime item CRUD, view endpoints, and item history in durable storage. It MUST preserve the existing caller-visible route, DTO, and query semantics across the persistence migration.

#### Scenario: Data survives restart
- GIVEN an item is created and later updated through the approved runtime API
- WHEN the process restarts and the item is fetched again
- THEN the same item state and identifiers MUST still exist
- AND the caller contract MUST remain unchanged

### Requirement: Persisted Relational Runtime Model

The system MUST durably represent users, groups, memberships, spaces, items, assignees, labels, and group audit history. Items MUST reference exactly one space and one owner. Memberships MUST connect users to groups. Assignees for group items MUST reference valid memberships. Labels MUST be reusable within their owning personal or group scope.

#### Scenario: Multiple-group reachability comes from persisted memberships
- GIVEN a user has persisted memberships in groups A and B
- WHEN runtime group access is resolved
- THEN the user MUST be able to reach persisted items in both groups

#### Scenario: Label reuse remains scoped
- GIVEN label `finance` already exists in one group scope
- WHEN another item in that same scope uses `finance`
- THEN the system MUST reuse that scoped label without affecting other scopes

### Requirement: Persisted Invariants And Concurrency

The system MUST preserve optimistic concurrency for item updates, MUST durably append item history for group-item changes, and MUST reject assignments or membership-dependent actions that conflict with persisted runtime truth. Personal visibility MUST remain owner-only. Group visibility MUST remain membership-based, including unassigned items.

#### Scenario: Group membership controls access after persistence
- GIVEN a persisted group item and a user without persisted membership in that group
- WHEN the user requests that group's runtime data
- THEN the system MUST deny access

#### Scenario: Unassigned group item visibility remains intact
- GIVEN a persisted group item has no assignees and the requester is a persisted member
- WHEN the requester opens My View or Group View
- THEN the item MUST remain eligible under the existing visibility rules

### Requirement: Persisted History Retrieval

The system MUST store group-item audit entries durably so history retrieval no longer depends on in-memory state. Retrieved history SHALL preserve actor identity, changed fields, ordering, and version context needed by the existing contract.

#### Scenario: History retrieval uses persisted audit entries
- GIVEN a persisted group item has recorded status and assignee changes
- WHEN its history is requested after a restart
- THEN the returned history MUST include those persisted audit entries in order

### Requirement: Bootstrap And Migration Behavior

The system MAY keep temporary mock or development identity resolution for the MVP slice, but runtime membership truth for handlers MUST come from persisted data. Migration from in-memory repositories to Prisma-backed repositories MUST preserve existing route contracts and SHOULD leave in-memory adapters available only for tests or controlled fallback.

#### Scenario: Bootstrap identity defers to persisted membership truth
- GIVEN development identity resolves a known user
- WHEN a handler evaluates group membership and assignment validity
- THEN it MUST use persisted memberships as the source of truth
