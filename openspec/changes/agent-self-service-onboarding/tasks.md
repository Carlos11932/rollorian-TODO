# Tasks: Agent Self-Service Onboarding

## Phase 1: Foundation

- [x] 1.1 Modify `src/lib/agents/types.ts`, `src/lib/agents/index.ts`, and `src/lib/agents/management.ts` so TODO matches the Books mutation payload contract with refreshed `recentEvents`.
- [x] 1.2 Update `src/app/api/agent-clients/route.ts` plus credential/revoke routes to return the canonical management payloads and preserve current auth/error behavior.
- [x] 1.3 Add or extend unit tests in `tests/unit/api/agent-clients/route.test.ts` and `tests/unit/lib/agents-management.test.ts` for create/issue/revoke parity.

## Phase 2: Settings Surface

- [x] 2.1 Create `src/app/settings/page.tsx` and the `src/features/settings/` components needed to list connections, reveal the latest token once, and trigger create/rotate/revoke actions.
- [x] 2.2 Modify `src/features/shared/ui/side-nav-bar.tsx` and `src/features/shared/ui/mobile-nav.tsx` to expose the Settings route without regressing current navigation.
- [x] 2.3 Add component tests for the settings panel covering token one-time visibility, busy states, and audit refresh.

## Phase 3: Provider Onboarding

- [x] 3.1 Create `src/lib/agents/onboarding.ts` with Codex, Claude Code, Cursor, and generic MCP snippet builders for the TODO MCP package.
- [x] 3.2 Create `src/features/settings/components/agent-onboarding-panel.tsx` and wire it into the settings UI with placeholder and live-token states.
- [x] 3.3 Add unit tests for snippet generation and panel rendering, including fallback behavior when no token is available.

## Phase 4: Verification

- [ ] 4.1 Run `npm run lint:strict`, `npm run typecheck`, `npm run test:run`, and `npm run test:coverage` after implementation changes land.
- [ ] 4.2 Run `npm run test:e2e` if the local TODO environment supports the authenticated Settings flow; otherwise document the exact blocker in the PR.
- [ ] 4.3 Execute the manual checklist: create connection, copy provider snippet, rotate/revoke, and confirm unrelated TODO views still work.
