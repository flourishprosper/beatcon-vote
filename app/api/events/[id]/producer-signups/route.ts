import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;
  const signups = await prisma.producerEventSignup.findMany({
    where: { eventId },
    include: {
      producer: {
        select: {
          id: true,
          stageName: true,
          slug: true,
          email: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(signups);
}

const addBySignupSchema = z.object({ signupId: z.string() });
const addByProducerSchema = z.object({ producerId: z.string() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;
  const body = await req.json();

  const bySignup = addBySignupSchema.safeParse(body);
  const byProducer = addByProducerSchema.safeParse(body);

  if (bySignup.success) {
    const signup = await prisma.producerEventSignup.findUnique({
      where: { id: bySignup.data.signupId },
      include: { producer: true },
    });
    if (!signup || signup.eventId !== eventId) {
      return NextResponse.json({ error: "Signup not found for this event" }, { status: 404 });
    }
    if (signup.participantId) {
      return NextResponse.json(
        { error: "This producer was already added to the event bracket" },
        { status: 400 }
      );
    }
    const participant = await prisma.participant.create({
      data: {
        eventId,
        name: signup.producer.stageName,
        imageUrl: signup.producer.imageUrl,
      },
    });
    await prisma.producerEventSignup.update({
      where: { id: signup.id },
      data: { participantId: participant.id },
    });
    return NextResponse.json(participant, { status: 201 });
  }

  if (byProducer.success) {
    const producer = await prisma.producer.findUnique({
      where: { id: byProducer.data.producerId },
    });
    if (!producer) {
      return NextResponse.json({ error: "Producer not found" }, { status: 404 });
    }
    let signup = await prisma.producerEventSignup.findUnique({
      where: {
        producerId_eventId: { producerId: producer.id, eventId },
      },
    });
    if (!signup) {
      signup = await prisma.producerEventSignup.create({
        data: {
          producerId: producer.id,
          eventId,
          agreeRules: true,
          agreeOriginal: true,
          agreeTimeLimits: true,
        },
      });
    }
    if (signup.participantId) {
      return NextResponse.json(
        { error: "This producer is already in the event." },
        { status: 400 }
      );
    }
    const participant = await prisma.participant.create({
      data: {
        eventId,
        name: producer.stageName,
        imageUrl: producer.imageUrl,
      },
    });
    await prisma.producerEventSignup.update({
      where: { id: signup.id },
      data: { participantId: participant.id },
    });
    return NextResponse.json(participant, { status: 201 });
  }

  return NextResponse.json(
    { error: "Provide either signupId or producerId" },
    { status: 400 }
  );
}
