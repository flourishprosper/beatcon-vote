import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = url.replace(/^file:/, "").replace(/^\.\//, "");
const dbPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@beatcon.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const hashed = await hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed },
  });
  console.log("Admin seeded:", admin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
