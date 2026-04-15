# Core Views Specification

## Purpose

Define My View, Group View, Calendar behavior, undated access, and deterministic attention rules.

## Requirements

### Requirement: My View And Group View

My View MUST show the user's personal items. My View MUST also show group items in the user's groups when the user is an assignee or when the item has no assignees. My View MUST NOT show group items assigned only to other people. Group View MUST show all items for the selected group. View eligibility MUST be evaluated independently from `requires attention`, so an unassigned group item that meets attention criteria MUST remain eligible for both My View and Group View under these same visibility rules.

#### Scenario: My View includes unassigned group work
- GIVEN a group item is visible to a member and has no assignees
- WHEN that member opens My View
- THEN the item MUST appear there

#### Scenario: My View excludes group work assigned only to others
- GIVEN a group item is visible to a member but assigned only to other group members
- WHEN that member opens My View
- THEN the item MUST NOT appear there

#### Scenario: Unassigned attention item stays eligible in both views
- GIVEN a visible group item has no assignees and meets `requires attention`
- WHEN a member opens My View and that group's Group View
- THEN the item MUST be eligible to appear in both views

### Requirement: Calendar Inclusion

Calendar MUST support `personal`, `group`, and `both` filters. Items with no relevant date MUST NOT appear in calendar views. Dated items MUST appear in the relevant day, week, and month ranges derived from their scheduled or due span. A dated event MUST remain visible whenever its scheduled range falls inside the selected calendar range even when its status is `completed`. Hiding completed events MAY be supported only as an explicit filter and MUST NOT be the default calendar behavior.

#### Scenario: Undated item excluded from calendar
- GIVEN an undated task exists
- WHEN the user opens any calendar range
- THEN the task MUST NOT appear in the calendar grid

#### Scenario: Dated item appears in range
- GIVEN an item spans April 14 to April 16
- WHEN the user views the week containing those dates
- THEN the item MUST appear in that weekly range

#### Scenario: Completed event remains visible by range
- GIVEN an event scheduled on April 14 is marked `completed`
- WHEN the user views a day, week, or month range that includes April 14
- THEN the event MUST remain visible in that calendar range by default

### Requirement: Undated Access And Attention

The system MUST provide a reachable undated-items access point for the active visibility filter. The system MUST compute a deterministic `requires attention` section containing only open items that meet at least one of these conditions: overdue, currently blocked, postponed until now-or-earlier, open for at least the product setting `attention_open_item_days`, or postponed at least the product setting `attention_postpone_count`. These product settings MUST be defined as global integer thresholds for the product MVP and MUST be applied consistently across personal and group visibility contexts. The active visibility filter MUST determine which items are considered, but it MUST NOT change the threshold values.

#### Scenario: Attention section is deterministic
- GIVEN a blocked task, an overdue task, and a future-postponed task that does not meet any threshold condition
- WHEN the user opens the attention section
- THEN only the blocked task and overdue task MUST appear

#### Scenario: Long-open item requires attention by threshold
- GIVEN an open item has remained open for at least `attention_open_item_days`
- WHEN the user opens the attention section
- THEN the item MUST appear there

#### Scenario: Repeatedly postponed item requires attention by threshold
- GIVEN an open item has been postponed at least `attention_postpone_count` times
- WHEN the user opens the attention section
- THEN the item MUST appear there

#### Scenario: Thresholds stay global across spaces
- GIVEN a personal item and a group item each meet `attention_open_item_days`
- WHEN the user opens their respective attention sections
- THEN both items MUST be evaluated with the same global threshold value
