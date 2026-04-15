# Agent API Contract Specification

## Purpose

Define stable CRUD-oriented expectations for future APIs and agents.

## Requirements

### Requirement: Stable Item Resource Shape

The system MUST expose the same core `Item` contract for human-facing and agent-facing CRUD flows, including stable identity, `item_type`, space identity, status, assignees, labels, priority, and temporal fields.

#### Scenario: Read returns stable contract
- GIVEN an existing item
- WHEN a client retrieves it by id
- THEN the response MUST include the same core fields regardless of whether the item is a task or event

### Requirement: CRUD Validation And Query Semantics

Create and update operations MUST enforce the domain invariants in these specs. List and query operations MUST support filtering by space, item type, status, assignee, label, priority, and dated-versus-undated state without changing item meaning.

#### Scenario: Invalid update is rejected
- GIVEN an existing task is updated to `item_type = event` without a scheduled start
- WHEN the update is submitted
- THEN the system MUST reject the update as invalid
