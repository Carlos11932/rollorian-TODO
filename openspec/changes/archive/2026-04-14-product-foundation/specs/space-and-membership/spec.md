# Space and Membership Specification

## Purpose

Define personal/group spaces, membership, visibility, and edit authority.

## Requirements

### Requirement: Space Types

The system MUST support `personal` and `group` spaces. Every item MUST belong to exactly one space. A user MAY belong to multiple groups simultaneously.

#### Scenario: User belongs to multiple groups
- GIVEN a user is a member of groups `A` and `B`
- WHEN the user accesses the product
- THEN items from both groups MAY be reached through their respective group contexts

### Requirement: Visibility Rules

Personal items MUST be visible only to their owner. Group items MUST be visible to members of that group and MUST NOT become hidden merely because an item is unassigned or assigned to someone else.

#### Scenario: Group member sees unassigned item
- GIVEN a group item has no assignees
- WHEN a group member opens that group view
- THEN the item MUST be visible to that member

### Requirement: Edit Authority

The owner MUST be able to edit personal items. Group members MUST be able to edit group items unless a future policy narrows this rule; assignment alone SHALL NOT grant or remove edit authority.

#### Scenario: Non-assignee edits visible group item
- GIVEN a user is a member of the group but not an assignee of the item
- WHEN the user updates the group item
- THEN the update MUST be allowed because edit authority comes from membership
