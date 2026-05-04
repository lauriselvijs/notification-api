import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../generated/prisma/client.ts";
import { databaseConfig } from "./database.config.ts";

const adapter = new PrismaMariaDb(databaseConfig.url);

export const prisma = new PrismaClient({ adapter });
