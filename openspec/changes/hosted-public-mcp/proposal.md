# Proposal: Hosted Public MCP

## Intent

Expose Books and TODO as remotely reachable MCP servers over Streamable HTTP so a user can connect from Codex, Claude Code, Cursor, or another compatible client **by URL**, without cloning the repo or running a local MCP process.

## Scope

### In Scope
- Public/hosted MCP transport for **Books** and **TODO** using the existing per-app MCP packages.
- Reuse of the current **user-scoped agent tokens** for authentication.
- Shared hosting topology with one public host and **separate services per app**.
- Settings/onboarding updates so users can choose between local stdio and hosted remote connection snippets.
- Operational requirements for health checks, logs, rate-limits, and path/version conventions.

### Out of Scope
- `rollorian-oura` in this first hosted rollout.
- OAuth-based auth or shared/global static secrets.
- Merging Books and TODO tools into a single monolithic MCP server.
- Marketplace/discovery UX beyond app Settings.

## Capabilities

### New Capabilities
- `public-mcp-hosting`: Hosted Streamable HTTP endpoints for Books and TODO with per-user bearer-token auth.

### Modified Capabilities
- `agent-connection-management`: Settings onboarding gains hosted/remote connection instructions in addition to local stdio snippets.

## Approach

Reuse the HTTP mode that already exists in both MCP packages, but move from loopback-only private usage to a public deployment model. Host both services behind the same public domain with path-based routing, while keeping runtime processes, tokens, tool catalogs, and upstream Agent APIs isolated per app.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/hosted-public-mcp/` | New | Planning and execution trail for the hosted rollout. |
| `mcp/rollorian-mcp/` in Books | Modified | Harden HTTP mode for public deployment and health/operability. |
| `mcp/rollorian-todo-mcp/` in TODO | Modified | Harden HTTP mode for public deployment and health/operability. |
| `src/features/settings/` in Books/TODO | Modified | Add hosted remote onboarding alongside stdio guidance. |
| Hosting/reverse-proxy config | New | Public TLS host with path-based routing to per-app MCP services. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Public exposure widens abuse surface | Med | Keep per-user agent tokens, add rate limits, logs, and health monitoring. |
| Cross-app leakage through shared hosting | Low | Use separate services and path-based routing; never mix tool catalogs or env vars. |
| Provider transport differences break onboarding | Med | Keep stdio fallback and verify hosted snippets against Codex, Claude Code, and Cursor docs before implementation. |

## Rollback Plan

Disable public routes at the reverse proxy and fall back to the already-shipped private stdio onboarding. Because local/self-service token issuance remains unchanged, rollback only affects remote transport availability.

## Dependencies

- Archived `agent-self-service-onboarding` change as the private/self-service baseline.
- Existing HTTP mode in:
  - `/Users/carlosbenito/rollorian-books/mcp/rollorian-mcp/src/index.ts`
  - `/Users/carlosbenito/rollorian-books/mcp/rollorian-mcp/src/http.ts`
  - `/Users/carlosbenito/rollorian-TODO/mcp/rollorian-todo-mcp/src/index.ts`
  - `/Users/carlosbenito/rollorian-TODO/mcp/rollorian-todo-mcp/src/http.ts`

## Success Criteria

- [ ] Books and TODO each expose a public HTTPS MCP endpoint without requiring local stdio setup.
- [ ] Existing user-issued agent tokens work unchanged against the hosted endpoints.
- [ ] Settings shows both local and hosted connection instructions.
- [ ] Shared hosting does not collapse Books and TODO into one mixed MCP runtime.
