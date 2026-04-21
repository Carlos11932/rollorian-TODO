import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { RollorianTodoAgentClient } from "./client.js";
import { buildRollorianTodoMcpServer } from "./server.js";

async function main() {
  const mockClient = {
    listItems: async () => ({ data: { items: [], totalCount: 0, filters: {} } }),
    getItem: async () => ({ data: { id: "item-1" } }),
    createItem: async () => ({ data: { id: "item-2" } }),
    updateItem: async () => ({ data: { id: "item-2", versionToken: 1 } }),
    getItemHistory: async () => ({ data: { entries: [], itemId: "item-1" } }),
    getMyView: async () => ({ data: { items: [], totalCount: 0, filters: {} } }),
    getAttentionView: async () => ({ data: { items: [], totalCount: 0, filters: {}, spaceFilter: "both" } }),
    getCalendarView: async () => ({ data: { items: [], totalCount: 0, filters: {}, spaceFilter: "both", range: { startAt: "2026-04-18T00:00:00.000Z", endAt: "2026-04-19T00:00:00.000Z" } } }),
    getUndatedView: async () => ({ data: { items: [], totalCount: 0, filters: {}, spaceFilter: "both" } }),
    getGroupView: async () => ({ data: { items: [], totalCount: 0, filters: {}, groupId: "group-1" } }),
  } satisfies Partial<RollorianTodoAgentClient>;

  const server = buildRollorianTodoMcpServer(mockClient as unknown as RollorianTodoAgentClient);
  const client = new Client({
    name: "rollorian-todo-mcp-smoke",
    version: "0.1.0",
  });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

  try {
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.request({
      method: "tools/list",
      params: {},
    }, ListToolsResultSchema);

    assert.equal(tools.tools.length, 10);
    assert.ok(tools.tools.some((tool) => tool.name === "create_item"));

    const result = await client.request({
      method: "tools/call",
      params: {
        name: "get_group_view",
        arguments: {
          groupId: "group-1",
        },
      },
    }, CallToolResultSchema);

    assert.equal(result.content[0]?.type, "text");
    assert.match(result.content[0]?.type === "text" ? result.content[0].text : "", /group-1/);
  } finally {
    await server.close();
    await client.close();
  }
}

main().catch((error) => {
  console.error("Rollorian Todo MCP smoke failed:", error);
  process.exit(1);
});
