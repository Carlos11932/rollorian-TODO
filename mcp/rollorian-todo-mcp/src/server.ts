import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RollorianTodoAgentClient } from "./client.js";

function toStructuredContent(output: unknown): Record<string, unknown> {
  if (output && typeof output === "object" && !Array.isArray(output)) {
    return output as Record<string, unknown>;
  }

  return { result: output };
}

function asToolResult(output: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      },
    ],
    structuredContent: toStructuredContent(output),
  };
}

export function buildRollorianTodoMcpServer(client = new RollorianTodoAgentClient()) {
  const server = new McpServer({
    name: "rollorian-todo-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "list_items",
    {
      title: "List items",
      description: "List items visible to the agent owner with optional filters.",
      inputSchema: {
        assigneeId: z.string().optional(),
        datedState: z.enum(["dated", "undated"]).optional(),
        groupId: z.string().optional(),
        includeCompletedEvents: z.boolean().optional(),
        itemType: z.enum(["task", "event"]).optional(),
        label: z.string().optional(),
        ownerId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        spaceType: z.enum(["personal", "group"]).optional(),
        status: z.string().optional(),
      },
    },
    async (input) => asToolResult(await client.listItems(input)),
  );

  server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "Read a single item by id within a specific scope.",
      inputSchema: {
        itemId: z.string(),
        scope: z.union([
          z.object({
            ownerId: z.string(),
            spaceId: z.string(),
            spaceType: z.literal("personal"),
          }),
          z.object({
            groupId: z.string(),
            spaceId: z.string(),
            spaceType: z.literal("group"),
          }),
        ]),
      },
    },
    async ({ itemId, scope }) => asToolResult(await client.getItem(itemId, scope)),
  );

  server.registerTool(
    "create_item",
    {
      title: "Create item",
      description: "Create a task or event using the Rollorian Todo agent API.",
      inputSchema: {
        body: z.record(z.string(), z.unknown()),
      },
    },
    async ({ body }) => asToolResult(await client.createItem(body)),
  );

  server.registerTool(
    "update_item",
    {
      title: "Update item",
      description: "Patch an existing item by id through the Rollorian Todo agent API.",
      inputSchema: {
        itemId: z.string(),
        body: z.record(z.string(), z.unknown()),
      },
    },
    async ({ itemId, body }) => asToolResult(await client.updateItem(itemId, body)),
  );

  server.registerTool(
    "get_item_history",
    {
      title: "Get item history",
      description: "Read persisted history entries for a group item.",
      inputSchema: {
        itemId: z.string(),
        query: z.object({
          groupId: z.string(),
          spaceId: z.string(),
          spaceType: z.literal("group"),
        }),
      },
    },
    async ({ itemId, query }) => asToolResult(await client.getItemHistory(itemId, query)),
  );

  server.registerTool(
    "get_my_view",
    {
      title: "Get my view",
      description: "Read the personal My View snapshot for the agent owner.",
      inputSchema: {
        filters: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ filters }) => asToolResult(await client.getMyView(filters as never)),
  );

  server.registerTool(
    "get_attention_view",
    {
      title: "Get attention view",
      description: "Read the Requires Attention view with optional filters.",
      inputSchema: {
        spaceFilter: z.enum(["both", "personal", "group"]),
        filters: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ spaceFilter, filters }) => asToolResult(await client.getAttentionView({
      spaceFilter,
      filters: filters as never,
    })),
  );

  server.registerTool(
    "get_calendar_view",
    {
      title: "Get calendar view",
      description: "Read the calendar view for a given range and optional filters.",
      inputSchema: {
        spaceFilter: z.enum(["both", "personal", "group"]),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
        filters: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ spaceFilter, startAt, endAt, filters }) => asToolResult(await client.getCalendarView({
      spaceFilter,
      startAt,
      endAt,
      filters: filters as never,
    })),
  );

  server.registerTool(
    "get_undated_view",
    {
      title: "Get undated view",
      description: "Read the undated view with optional filters.",
      inputSchema: {
        spaceFilter: z.enum(["both", "personal", "group"]),
        filters: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ spaceFilter, filters }) => asToolResult(await client.getUndatedView({
      spaceFilter,
      filters: filters as never,
    })),
  );

  server.registerTool(
    "get_group_view",
    {
      title: "Get group view",
      description: "Read the group view for a specific group id.",
      inputSchema: {
        groupId: z.string(),
        filters: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ groupId, filters }) => asToolResult(await client.getGroupView(groupId, filters as never)),
  );

  return server;
}
