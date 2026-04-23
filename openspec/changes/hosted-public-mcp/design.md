# Design: Hosted Public MCP

## Technical Approach

Both Books and TODO already ship an MCP package with `stdio` and `http` modes. The hosted rollout will reuse those per-app MCP packages and expose their HTTP mode publicly behind one TLS host with path-based routing:

- `/books/mcp` → Books MCP service
- `/todo/mcp` → TODO MCP service

This keeps the deployment simple: one public host, two isolated Node services, no shared tool runtime, and no new monolithic gateway.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|-------------------------|-----------|
| Hosting topology | One public host with path-based routing to **separate** Books/TODO MCP services | Separate domains per app; one merged MCP server | Same host simplifies onboarding and ops, while separate services preserve isolation and avoid cross-app tool drift. |
| Transport | Streamable HTTP for hosted mode, keep stdio as fallback | SSE only; hosted-only with no local fallback | The current MCP packages already implement HTTP mode, and supported clients can use remote URLs while local stdio remains the escape hatch. |
| Auth model | Reuse existing per-user bearer tokens | Global shared secret; OAuth in v1 | The user-token model already exists, is safer, and preserves revoke/rotate/audit semantics. |
| Runtime reuse | Harden existing MCP packages instead of building a new gateway app | New multi-app gateway repository | Reuse reduces duplication and keeps business tools close to each app's Agent API contract. |
| Public exposure | Reverse proxy + TLS in front of long-lived Node services | Serverless-only runtime | Hosted MCP needs stable HTTP transport behavior and operational controls better served by long-lived services. |

## Data Flow

`MCP client (Codex/Claude/Cursor)` → `https://<public-host>/<app>/mcp` → `reverse proxy` → `per-app MCP service (Books or TODO)` → `app Agent API` → `MCP response`

Auth path:

`user token from Settings` → `MCP client config` → `hosted MCP service env/request` → `Authorization: Bearer <token>` → `Agent API`

## File Changes

| File / Area | Action | Description |
|-------------|--------|-------------|
| `mcp/rollorian-mcp/src/http.ts` in Books | Modify | Public deployment hardening, health signal, proxy-safe config, and hosted routing assumptions. |
| `mcp/rollorian-todo-mcp/src/http.ts` in TODO | Modify | Same hardening and operability contract as Books. |
| `mcp/rollorian-mcp/README.md` | Modify | Document hosted/remote usage in addition to local stdio/http. |
| `mcp/rollorian-todo-mcp/README.md` | Modify | Document hosted/remote usage in addition to local stdio/http. |
| `src/features/settings/` in Books | Modify | Add hosted snippets and transport choice UI. |
| `src/features/settings/` in TODO | Modify | Add hosted snippets and transport choice UI. |
| Hosting config / infra repo | Create/Modify | Reverse proxy, TLS, health checks, rate limits, and service definitions. |

## Interfaces / Contracts

Hosted route contract:

- `POST /books/mcp`
- `POST /todo/mcp`

Operational side-contract:

- `GET /books/health`
- `GET /todo/health`

Settings onboarding contract extension:

```ts
type AgentOnboardingTransport = "stdio" | "hosted-http";
```

Each app's onboarding builder will emit both:
- local stdio snippets
- hosted URL-based snippets

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | Hosted snippet generation and route selection | Extend onboarding helper tests in Books and TODO. |
| Integration | HTTP-mode MCP auth forwarding and error mapping | Add smoke/integration tests for per-app `/mcp` endpoints. |
| Ops | Health checks and rate limiting | Verify deployed services respond on health endpoints and reject abuse safely. |
| Manual/E2E | Real remote setup from Codex, Claude Code, and Cursor | Validate one successful remote connection per supported client before merge. |

## Migration / Rollout

1. Harden the existing HTTP mode in both MCP packages.
2. Deploy both services behind one public host with path-based routing.
3. Add hosted snippets in Settings while keeping stdio fallback.
4. Pilot with internal/private use before announcing general availability.

## Open Questions

- [ ] Final public domain name for the shared host.
- [ ] Exact infra repository or platform that will own the reverse proxy and process supervision.
