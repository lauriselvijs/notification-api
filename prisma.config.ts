import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databaseConfig } from "./src/infrastructure/database/database.config.ts";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseConfig.url,
  },
});
