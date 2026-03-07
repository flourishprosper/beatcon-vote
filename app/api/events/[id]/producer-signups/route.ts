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

const addSchema = z.object({ signupId: z.string() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;
  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const signup = await prisma.producerEventSignup.findUnique({
    where: { id: parsed.data.signupId },
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
