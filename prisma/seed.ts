import "dotenv/config";
import { prisma } from "../lib/db";
import { hash } from "bcryptjs";

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
