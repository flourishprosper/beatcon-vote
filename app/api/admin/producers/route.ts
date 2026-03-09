import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

export async function GET(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || null;

  const where = q
    ? {
        OR: [
          { stageName: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const producers = await prisma.producer.findMany({
    where,
    orderBy: { stageName: "asc" },
    select: {
      id: true,
      stageName: true,
      slug: true,
      email: true,
      fullName: true,
    },
  });

  return NextResponse.json(producers);
}
