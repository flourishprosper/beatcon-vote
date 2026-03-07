import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: {
      stageName: true,
      fullName: true,
      genre: true,
      productionStyle: true,
      imageUrl: true,
      cityState: true,
      yearsProducing: true,
      instagramHandle: true,
      eventSignups: {
        include: { event: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!producer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...producer,
    eventSignups: producer.eventSignups.map((s) => ({
      event: s.event,
      createdAt: s.createdAt,
    })),
  });
}
