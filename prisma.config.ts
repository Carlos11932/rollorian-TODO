import { defineConfig } from "@prisma/config";
import { config } from "dotenv";

config({ path: ".env.local" });

const datasourceUrl =
  process.env["DATABASE_URL_UNPOOLED"]
  ?? process.env["DIRECT_URL"]
  ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl as string,
  },
});
