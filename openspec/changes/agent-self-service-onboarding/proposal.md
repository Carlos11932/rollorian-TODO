# Proposal: Agent Self-Service Onboarding

## Intent

Bring the merged Books MCP self-service pattern into TODO so authenticated users can generate scoped agent tokens from Settings and connect Codex, Claude Code, Cursor, or a generic stdio MCP client without manual backend intervention.

## Scope

### In Scope
- Define the TODO change around user-scoped agent connections, one-time tokens, rotate/revoke, audit visibility, and provider onboarding snippets.
- Add a Settings surface and navigation entry for managing agent connections inside the app shell.
- Align TODO management responses with the Books canonical contract so UI state stays synchronized after each mutation.

### Out of Scope
- Shared packages between Books and TODO.
- Hosted/public MCP transport.
- Scope presets, agent marketplace UX, or non-user-scoped tokens.

## Capabilities

### New Capabilities
- `agent-connection-management`: User-scoped Settings flow for agent clients, credentials, audit events, and provider onboarding.

### Modified Capabilities
- None.

## Approach

Use Books as the canonical behavioral reference and adapt it to TODO's App Router + feature-folder structure. Keep the existing `/api/agent-clients` route family, add a Settings page plus feature components, and generate provider snippets from a shared onboarding helper instead of embedding commands inline.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/agent-self-service-onboarding/` | New | Proposal, spec, design, and task trail for the TODO rollout. |
| `src/app/settings/` | New | Server entry point for authenticated self-service management. |
| `src/features/settings/` | New | UI for create/rotate/revoke flows and onboarding snippets. |
| `src/lib/agents/` | Modified | Canonical management payloads and onboarding helper. |
| `tests/unit/` | Modified | Coverage for route, helper, and panel behavior. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TODO drifts from Books behavior | Med | Treat Books PR #46 as the contract reference in spec/design. |
| UI leaks stale audit state after mutations | Med | Require refreshed `recentEvents` in mutation responses and tests. |
| Token copy UX becomes ambiguous | Low | Specify one-time reveal and provider snippets in the spec. |

## Rollback Plan

Revert the TODO branch or remove the Settings entry points before merge. Because phase 0 only adds planning artifacts, no data migration or runtime rollback is required yet.

## Dependencies

- Books PR #46 merged into `main` on 2026-04-22.
- Existing TODO agent management routes and Prisma models.

## Success Criteria

- [ ] The OpenSpec change defines the canonical TODO implementation path before code changes start.
- [ ] The change locks user-scoped token issuance, revoke/rotate/audit, and provider onboarding as required behavior.
- [ ] The follow-up implementation can be executed phase-by-phase with one commit per phase on the TODO branch.
