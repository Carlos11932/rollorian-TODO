# Rollorian Todo MCP

Private MCP server for `rollorian-todo`. It does not access Prisma or the database directly. It only calls the Agent API:

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

## Environment

```bash
ROLLORIAN_TODO_BASE_URL=https://your-rollorian-todo.vercel.app
ROLLORIAN_TODO_AGENT_TOKEN=your-issued-agent-token
ROLLORIAN_TODO_MCP_MODE=stdio
ROLLORIAN_TODO_MCP_HTTP_HOST=127.0.0.1
ROLLORIAN_TODO_MCP_HTTP_PORT=8789
```

## Build and smoke test

```bash
cd mcp/rollorian-todo-mcp
npm ci
npm run build
npm run smoke
```
