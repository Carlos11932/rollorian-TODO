# Rollorian Todo Agent API

Private CRUD-oriented Agent API for MCP clients and companions.

## Auth

- Agent API: `Authorization: Bearer <issued-agent-token>`
- Management API: session-authenticated user in the web app

## Management endpoints

- `GET /api/agent-clients`
- `POST /api/agent-clients`
- `POST /api/agent-clients/[agentClientId]/credentials`
- `POST /api/agent-clients/[agentClientId]/credentials/[credentialId]/revoke`
- `POST /api/agent-clients/[agentClientId]/revoke`

## Agent API endpoints

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

## Examples

- [item.response.json](./item.response.json)
- [my-view.response.json](./my-view.response.json)
- [history.response.json](./history.response.json)
- [errors/unauthorized.json](./errors/unauthorized.json)
- [errors/forbidden.json](./errors/forbidden.json)
- [errors/version-conflict.json](./errors/version-conflict.json)
