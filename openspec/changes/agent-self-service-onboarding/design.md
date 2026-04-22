# Design: Agent Self-Service Onboarding

## Technical Approach

Implement TODO's self-service MCP management by reusing the behavior already merged in Books and adapting it to TODO's current App Router + `src/features/*` structure. The existing `/api/agent-clients` management routes remain the backend surface; phase 1 adds the missing Settings UI, onboarding helper, and response parity needed to keep the UI synchronized after each mutation.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|-------------------------|-----------|
| Canonical reference | Treat Books PR #46 as the behavioral source of truth | Re-design TODO independently | Prevents drift across Rollorian apps while avoiding premature abstraction. |
| Sharing strategy | No shared package in v1 | Shared onboarding/management package | Contract parity is enough for now; shared code would slow delivery and couple both repos too early. |
| Scope model | Keep TODO's raw agent scopes (`items:*`, `views:*`, `history:*`) | Introduce presets first | Presets are product UX, not a prerequisite for parity; backend scope semantics already exist. |
| UI composition | Server `src/app/settings/page.tsx` + feature components + pure onboarding helper | Inline everything in one page | Keeps data loading server-side, snippet generation testable, and UI wiring consistent with existing feature folders. |

## Data Flow

`Settings page` → `listAgentClientsForUser + listRecentAgentAuditEventsForUser` → `AgentSettingsPanel`

`AgentSettingsPanel` → `/api/agent-clients*` mutations → `client + recentEvents + plainToken?` → local state refresh → `AgentOnboardingPanel`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/settings/page.tsx` | Create | Authenticated server entry that resolves base URL and initial management state. |
| `src/features/settings/components/agent-settings-panel.tsx` | Create | Client-side create/rotate/revoke UI and latest token handling. |
| `src/features/settings/components/agent-onboarding-panel.tsx` | Create | Provider switcher and copyable MCP snippets. |
| `src/features/settings/ui/settings-page.tsx` | Create | Optional composition layer if TODO keeps page markup in features. |
| `src/lib/agents/onboarding.ts` | Create | Pure provider snippet builder for Codex, Claude Code, Cursor, and generic MCP. |
| `src/lib/agents/types.ts` | Modify | Add refreshed mutation payload shape parity with Books. |
| `src/lib/agents/index.ts` | Modify | Re-export onboarding and updated types. |
| `src/lib/agents/management.ts` | Modify | Return refreshed client summaries and user recent events after mutations. |
| `src/app/api/agent-clients/**/*.ts` | Modify | Return the canonical mutation payloads. |
| `src/features/shared/ui/side-nav-bar.tsx` | Modify | Add Settings navigation entry on desktop. |
| `src/features/shared/ui/mobile-nav.tsx` | Modify | Add Settings navigation entry on mobile. |
| `tests/unit/api/agent-clients/route.test.ts` | Modify | Assert refreshed mutation responses. |
| `tests/unit/lib/agents-management.test.ts` | Modify | Cover management response semantics. |
| `tests/unit/lib/agents-onboarding.test.ts` | Create | Verify provider snippets and placeholders. |

## Interfaces / Contracts

```ts
export type AgentClientMutationResponse = {
  client: AgentClientSummary;
  recentEvents: AgentAuditEventSummary[];
  plainToken?: string;
};
```

`buildAgentOnboardingSnippets({ baseUrl, serverName, repoRootPlaceholder, token })` returns one entry per provider with a primary snippet and optional follow-up snippet.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | Snippet generation, placeholder/token handling | Add pure helper tests in `tests/unit/lib/agents-onboarding.test.ts`. |
| Unit/API | Create/issue/revoke payload parity and auth errors | Extend `tests/unit/api/agent-clients/route.test.ts`. |
| Unit/UI | Settings panel interactions and latest token/audit refresh | Add component tests alongside the new settings components. |
| E2E/manual | Create token, copy snippet, revoke/rotate, nav access | Manual regression checklist before merge; automate later if TODO E2E can cover auth. |

## Migration / Rollout

No data migration required. Rollout is branch-based: phase 0 docs, phase 1 implementation, phase 2 onboarding, phase 3 regression hardening.

## Open Questions

- [ ] Whether TODO should expose a dedicated settings composition page under `src/features/settings/ui/` or keep the page markup directly in `src/app/settings/page.tsx`.
