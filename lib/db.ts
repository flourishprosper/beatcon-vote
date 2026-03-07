import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = url.replace(/^file:/, "").replace(/^\.\//, "");
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath || "prisma/dev.db");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbUrl() }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
