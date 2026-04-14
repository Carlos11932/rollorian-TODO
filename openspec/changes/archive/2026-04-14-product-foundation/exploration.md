## Exploration: product-foundation

### Current State
The repository has no product code, stack, specs, or established architecture yet. The only existing SDD artifact is `openspec/config.yaml`, so this exploration defines the domain foundation and the minimum truth that proposal/spec/design must formalize next.

### Affected Areas
- `openspec/changes/product-foundation/exploration.md` — exploration baseline for the change.
- `openspec/changes/product-foundation/proposal.md` — should lock MVP scope, delivery slices, and rollback-safe sequencing.
- `openspec/changes/product-foundation/specs/domain/spec.md` — should become source of truth for item lifecycle, spaces, assignment, labels, and visibility rules.
- `openspec/changes/product-foundation/design.md` — should define architecture boundaries for UI, API, auth/membership, item service, history, and calendar/query projections.

### Approaches
1. **Unified `Item` aggregate with typed rules** — Keep one base entity for tasks and events, differentiated by `item_type` and guarded by type-specific invariants.
   - Pros: matches the product mental model, supports shared CRUD/history/assignment/labels, simplifies agent-facing APIs, and avoids duplicating cross-cutting concerns across task/event tables.
   - Cons: requires disciplined invariant enforcement so event-only and task-only fields do not devolve into a loose nullable blob.
   - Effort: Medium

2. **Separate `Task` and `Event` aggregates** — Model them as distinct roots with duplicated shared metadata.
   - Pros: stricter type separation and simpler per-entity validation at first glance.
   - Cons: duplicates assignment/labels/history/space/group/calendar logic, complicates unified views, and makes future agent APIs more fragmented.
   - Effort: Medium/High

3. **Hybrid wrapper model (`Item` shell + subtype records)** — Shared outer identity with task/event subtype tables.
   - Pros: preserves a unified API while keeping subtype-specific storage.
   - Cons: adds join complexity and design overhead before the product has enough proven divergence to justify it.
   - Effort: High

### Recommendation
Use **Approach 1: a unified `Item` model with explicit typed invariants**.

Why this is the right foundation:
- The product already centers on a shared operational surface: personal/group spaces, assignments, labels, history, calendar inclusion, and future agent CRUD.
- Tasks and events differ mainly in **workflow rules**, not in their need for separate ownership, visibility, tagging, or audit models.
- A single item contract keeps UI views and future mobile/agent integrations consistent: list, filter, assign, label, reschedule, and audit can all target one resource shape.
- The risk of an anemic “god entity” is REAL, but it is solved by design discipline: shared fields in the base model, type-specific status enums/rules, and validation that forbids invalid combinations.

Recommended domain boundary direction:
- **Core domain**: Item lifecycle, item type rules, space rules (`personal` vs `group`), group membership, assignment, labels, priority, postponement, blocking, history.
- **Application/query layer**: My View, Group View, Calendar, and smart sections such as “Requires attention”.
- **Out of MVP**: notifications, recurrence, comments, attachments, advanced stats, automations.

### Risks
- If type-specific invariants are not explicit, the unified `Item` model can become a weak catch-all schema.
- Calendar logic can become inconsistent unless “dated” vs “undated” is specified as a first-class rule with deterministic inclusion/exclusion behavior.
- Group editability plus shared history introduces concurrency and audit requirements earlier than a typical MVP.
- Assignment is independent from visibility, so proposal/spec must prevent accidental coupling between “who can see” and “who is assigned”.
- “Requires attention” can become hand-wavy unless the trigger rules are defined as deterministic query logic rather than UI copy.

### Ready for Proposal
Yes — but ONLY if the next artifacts lock the following as OpenSpec truth:
1. **Item contract**: shared fields, allowed optional date shapes, `item_type`, and invariant matrix by type.
2. **Lifecycle rules**: task statuses vs event statuses, valid transitions, and explicit postpone/block semantics.
3. **Space and access model**: personal items, group items, group membership, edit authority, and history requirements.
4. **Assignment model**: unassigned / single / multiple assignees, independent from visibility.
5. **Classification model**: group-shared labels/tags created on demand; priority with four fixed levels.
6. **View/query rules**: My View, Group View, Calendar filters, and hard rule that undated items MUST NOT appear in calendar views but MUST remain reachable via a visible access point/counter.
7. **Agent/API readiness**: one stable CRUD-oriented resource model that external agents can use without separate task/event integration paths.
