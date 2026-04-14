# Item Domain Specification

## Purpose

Define the unified `Item` resource, typed invariants, classification, lifecycle, temporal rules, and shared-item history.

## Requirements

### Requirement: Unified Item Contract

The system MUST expose one `Item` resource with `item_type = task | event`. A `task` MAY be undated and MAY use start, end, and/or due dates. An `event` MUST have a scheduled start and MAY have an end, but MUST NOT be due-date-only.

#### Scenario: Create undated task
- GIVEN a user creates an item with `item_type = task` and no temporal fields
- WHEN the item is saved
- THEN the item is valid as an undated task

#### Scenario: Reject date-less event
- GIVEN a user creates an item with `item_type = event` and no start value
- WHEN the item is validated
- THEN the system MUST reject the item as invalid

### Requirement: Classification And Priority

The system MUST support reusable labels within the owning scope and MUST support exactly four priority levels: `low`, `medium`, `high`, `urgent`.

#### Scenario: Reuse group label
- GIVEN a group already uses label `finance`
- WHEN another group item is labeled `finance`
- THEN the same label MUST remain reusable in that group scope

### Requirement: Lifecycle Semantics

Task status MUST be one of `pending`, `in_progress`, `blocked`, `postponed`, `done`, `canceled`. Event status MUST be one of `scheduled`, `completed`, `canceled`. `blocked` MUST mean work cannot proceed until an identified blocker is resolved. `postponed` MUST keep the task open and intentionally deferred, never completed.

#### Scenario: Blocked task stays open
- GIVEN a task is `blocked`
- WHEN a user views its lifecycle state
- THEN the task MUST remain incomplete and require blocker resolution before normal progress resumes

#### Scenario: Postponed task is not done
- GIVEN a task is `postponed`
- WHEN lists are filtered for completed work
- THEN the task MUST NOT appear as completed or canceled

### Requirement: Shared Item History

The system MUST record auditable history for group items whenever status, assignees, priority, labels, dates, title, or cancellation/completion state changes.

#### Scenario: Capture group edit history
- GIVEN a group item changes from `pending` to `in_progress`
- WHEN the change is saved
- THEN the history MUST record who changed it and what changed
