import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startHttpServer } from "./http.js";
import { buildRollorianTodoMcpServer } from "./server.js";

async function main() {
  const mode = process.argv[2] ?? process.env.ROLLORIAN_TODO_MCP_MODE ?? "stdio";

  if (mode === "http") {
    await startHttpServer();
    return;
  }

  const server = buildRollorianTodoMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Rollorian Todo MCP failed to start:", error);
  process.exit(1);
});
