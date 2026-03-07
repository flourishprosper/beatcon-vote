import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireProducer, getProducerId } from "@/lib/auth-producer";

const createSchema = z.object({
  eventId: z.string(),
  agreeRules: z.literal(true),
  agreeOriginal: z.literal(true),
  agreeTimeLimits: z.literal(true),
});

export async function GET() {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const signups = await prisma.producerEventSignup.findMany({
    where: { producerId },
    include: { event: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(signups);
}

export async function POST(req: Request) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (!event.acceptsProducerRegistration) {
    return NextResponse.json(
      { error: "This event is not accepting producer registration" },
      { status: 400 }
    );
  }

  try {
    const signup = await prisma.producerEventSignup.create({
      data: {
        producerId,
        eventId: parsed.data.eventId,
        agreeRules: parsed.data.agreeRules,
        agreeOriginal: parsed.data.agreeOriginal,
        agreeTimeLimits: parsed.data.agreeTimeLimits,
      },
      include: { event: { select: { id: true, name: true, slug: true } } },
    });
    return NextResponse.json(signup, { status: 201 });
  } catch (e) {
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }
    throw e;
  }
}
