import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  maxVotesPerUser: z.number().int().min(1).optional().default(1),
});

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participants: true, matchups: true } },
      showState: true,
    },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  try {
    const event = await prisma.event.create({
      data: parsed.data,
    });
    await prisma.showState.create({
      data: { eventId: event.id },
    });
    return NextResponse.json(event);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    throw e;
  }
}
