import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  const [voters, producers, admins] = await Promise.all([
    prisma.voterIdentity.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, phone: true, contactConsent: true, createdAt: true },
    }),
    prisma.producer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        stageName: true,
        slug: true,
        fullName: true,
        phone: true,
        genre: true,
        createdAt: true,
      },
    }),
    prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ voters, producers, admins });
}
