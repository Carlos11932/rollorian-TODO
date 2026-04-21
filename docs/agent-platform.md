# Rollorian Todo Agent Platform

`rollorian-todo` exposes a private Agent API for companions and MCP clients.

## Architecture

`domain/application -> session runtime or agent runtime -> Agent API HTTP -> MCP server`

- Human routes resolve actor context from NextAuth sessions
- Agent routes resolve actor context from issued agent credentials
- MCP lives in `mcp/rollorian-todo-mcp` and only talks to HTTP

## Management surface

Management uses the signed-in session:

- `GET /api/agent-clients`
- `POST /api/agent-clients`
- `POST /api/agent-clients/[agentClientId]/credentials`
- `POST /api/agent-clients/[agentClientId]/credentials/[credentialId]/revoke`
- `POST /api/agent-clients/[agentClientId]/revoke`

## Agent API

- `GET /api/agent/v1/items`
- `POST /api/agent/v1/items`
- `GET /api/agent/v1/items/[id]`
- `PATCH /api/agent/v1/items/[id]`
- `GET /api/agent/v1/items/[id]/history`
- `GET /api/agent/v1/views/my`
- `GET /api/agent/v1/views/attention`
- `GET /api/agent/v1/views/calendar`
- `GET /api/agent/v1/views/undated`
- `GET /api/agent/v1/views/groups/[groupId]`

## Scopes

- `items:read`
- `items:write`
- `views:read`
- `history:read`

## Validation

```bash
npm run lint:strict
npm run typecheck
npm run test:run
npm run build
cd mcp/rollorian-todo-mcp
npm ci
npm run build
npm run smoke
```
