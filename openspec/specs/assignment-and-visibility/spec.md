# Assignment and Visibility Specification

## Purpose

Define assignee cardinality and keep assignment independent from access.

## Requirements

### Requirement: Assignment Cardinality

An item MUST support zero assignees, one assignee, or multiple assignees. Personal items SHOULD only assign the owner. Group items MUST only assign members of the owning group.

#### Scenario: Multi-assign group item
- GIVEN a group has members Ana, Ben, and Cris
- WHEN a group item is assigned to Ana and Ben
- THEN the item MUST persist both assignees as valid

#### Scenario: Reject non-member assignee
- GIVEN a user is not a member of the owning group
- WHEN that user is added as an assignee
- THEN the system MUST reject the assignment

### Requirement: Assignment Does Not Control Access

Assignment MUST represent responsibility, not visibility. Changing assignees MUST NOT change who can view or edit the item beyond the space rules.

#### Scenario: Remove assignee without hiding item
- GIVEN a group member can see a group item through membership
- WHEN that member is removed from the assignee list but remains in the group
- THEN the item MUST stay visible and editable to that member
