# Proposal: Product Foundation

## Intent

Establish the first OpenSpec source of truth for rollorian-TODO before stack selection. The product solves personal and group coordination with one consistent domain: users manage tasks/events across personal and shared spaces, with views that stay usable for humans and stable for future agents/APIs.

## Scope

### In Scope
- Formalize product intent, MVP boundaries, and why this foundation is needed now.
- Lock the recommended unified `Item` direction with typed invariants for tasks/events.
- Define space model: `personal` and `group`, including multiple groups per user.
- Preserve separation between visibility/access and assignment.
- Establish MVP views: My View, Group View, Calendar.
- Require one agent/API-ready resource model and sequencing-safe delivery before stack choice.

### Out of Scope
- Stack/framework/database selection.
- Notifications, recurrence, comments, attachments, automations, advanced analytics.
- Detailed UX flows, schema design, or implementation architecture.

## Capabilities

### New Capabilities
- `item-domain`: Unified `Item` contract, type rules, lifecycle, labels, priority, history.
- `space-and-membership`: Personal/group spaces, memberships, multi-group participation, edit authority.
- `assignment-and-visibility`: Independent assignment and access semantics.
- `core-views`: My View, Group View, Calendar inclusion/exclusion rules.
- `agent-api-contract`: Stable CRUD-oriented external contract over the item model.

### Modified Capabilities
- None.

## Approach

Adopt a single `Item` aggregate with explicit type-specific invariants instead of separate task/event roots. Sequence work foundation-first: proposal → domain specs → design → stack-specific implementation. Calendar rules MUST treat dated vs undated items deterministically, and assignment MUST remain independent from who can view/edit an item.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/product-foundation/proposal.md` | New | Foundation intent, scope, sequencing, rollback. |
| `openspec/changes/product-foundation/specs/domain/spec.md` | New | Domain truth for item, spaces, assignment, visibility, views. |
| `openspec/changes/product-foundation/design.md` | New | Future boundaries for UI, API, auth/membership, item, history, query/calendar projections. |
| `openspec/specs/` | New later | Main source-of-truth specs after archive. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unified model becomes a catch-all blob | Med | Lock invariant matrix in specs before design/implementation. |
| Assignment gets coupled to visibility | Med | Specify separate rules and examples in specs. |
| Calendar semantics stay ambiguous | Med | Define dated/undated inclusion rules as contract behavior. |

## Rollback Plan

Safe rollback is artifact-level: revert/remove this proposal and stop before specs/design implementation. If later artifacts diverge, archive nothing, update proposal first, then regenerate downstream artifacts.

## Dependencies

- `openspec/changes/product-foundation/exploration.md`
- Subsequent `sdd-spec` and `sdd-design` phases

## Success Criteria

- [ ] Proposal clearly defines product intent, MVP boundaries, and why now.
- [ ] Proposal names the new capabilities required for spec writing.
- [ ] Proposal identifies affected areas/modules and a rollback-safe sequencing plan.
