# Tasks: Hosted Public MCP

## Phase 1: Hosting Contract

- [ ] 1.1 Define the public host/path contract for Books and TODO (`/books/mcp`, `/todo/mcp`) plus matching health endpoints.
- [ ] 1.2 Specify the operational baseline for TLS termination, logs, and rate limiting on the shared host.
- [ ] 1.3 Document how existing user-issued tokens are forwarded unchanged to each app's Agent API.

## Phase 2: MCP Service Hardening

- [ ] 2.1 Update the Books MCP HTTP mode for public deployment concerns (proxy-safe config, health signal, transport-safe auth failures).
- [ ] 2.2 Update the TODO MCP HTTP mode with the same public deployment contract.
- [ ] 2.3 Add smoke/integration coverage for hosted HTTP auth forwarding and failure handling in both MCP packages.

## Phase 3: Settings Onboarding

- [ ] 3.1 Extend Books onboarding so the user can choose between local stdio and hosted remote setup.
- [ ] 3.2 Extend TODO onboarding with the same transport choice and hosted snippets.
- [ ] 3.3 Keep local stdio instructions available as a documented fallback in both apps.

## Phase 4: Verification

- [ ] 4.1 Validate hosted connectivity end-to-end from Codex against the public URL path.
- [ ] 4.2 Validate hosted connectivity end-to-end from Claude Code against the public URL path.
- [ ] 4.3 Validate hosted connectivity end-to-end from Cursor against the public URL path.
- [ ] 4.4 Execute the operational checklist: health checks, logs, rate limiting, and revoked-token rejection.
