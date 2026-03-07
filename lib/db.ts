import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString =
  process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
const adapter = connectionString
  ? new PrismaNeon({ connectionString })
  : undefined;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    adapter
      ? { adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] }
      : { log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] }
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
