import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { acceptsProducerRegistration: true },
    select: { id: true, name: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}
