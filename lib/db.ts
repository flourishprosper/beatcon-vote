import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString =
  process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL;
const neonAdapter = connectionString
  ? new PrismaNeon({ connectionString })
  : null;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const logLevel: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  (neonAdapter
    ? new PrismaClient({ adapter: neonAdapter, log: logLevel })
    : new PrismaClient({ log: logLevel } as any));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
