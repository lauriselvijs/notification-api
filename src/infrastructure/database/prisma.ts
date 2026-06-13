import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../../../generated/prisma/client.ts";
import { databaseConfig } from "./database.config.ts";

const adapter = new PrismaMariaDb(databaseConfig.url);
const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export const prisma = new PrismaClient({ adapter });

export const getPrisma = (): PrismaClient | Prisma.TransactionClient =>
  transactionStorage.getStore() ?? prisma;

export const runInTransaction = async <T>(
  operation: () => Promise<T>,
): Promise<T> =>
  prisma.$transaction((tx) => transactionStorage.run(tx, operation));
