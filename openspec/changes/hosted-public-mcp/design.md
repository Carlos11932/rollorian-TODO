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

## Phase 1 Hosting Contract (resolved)

### Canonical external routes

The hosted rollout standardizes on one public host with stable per-app paths:

- `https://<mcp-host>/books/mcp`
- `https://<mcp-host>/todo/mcp`
- `https://<mcp-host>/books/health`
- `https://<mcp-host>/todo/health`

This keeps onboarding snippets stable even if the internal service topology changes.

### Reverse proxy responsibilities

The reverse proxy is responsible for:

- TLS termination for the shared public host
- path-based routing to the correct app-specific MCP service
- preserving proxy context headers needed for observability (`x-forwarded-for`, `x-forwarded-proto`, request id or equivalent)
- enforcing public method boundaries:
  - `POST` on `/<app>/mcp`
  - `GET` on `/<app>/health`

### App service responsibilities

Each MCP service remains isolated and owns:

- its own MCP tool catalog
- its own upstream Agent API base URL
- its own request/auth error mapping
- its own health response

No service may read the other app's env vars or proxy requests to the other app's Agent API.

### Authentication contract

Hosted MCP does **not** mint new credentials. The MCP client continues to provide the same user-issued bearer token created in app Settings. The hosted service forwards that token unchanged to the upstream Agent API and maps upstream auth failures to transport-safe MCP errors.

### Operational baseline

Phase 1 locks the minimum hosted baseline:

- HTTPS only on the public host
- structured request/error logs with app, path, request correlation, status, and latency
- explicit redaction of `Authorization` and any bearer token values from logs
- rate limiting or equivalent abuse protection at the public edge
- app-specific health endpoints suitable for uptime checks and deploy verification

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

Minimal health payload contract:

```json
{
  "status": "ok",
  "service": "rollorian-books-mcp"
}
```

or

```json
{
  "status": "ok",
  "service": "rollorian-todo-mcp"
}
```

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
- [ ] Exact hosted client snippets to prefer per provider once we validate the current remote-MCP docs against the chosen public URLs.
