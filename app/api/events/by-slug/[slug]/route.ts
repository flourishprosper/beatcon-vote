import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      venueName: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      eventStartsAt: true,
      eventEndsAt: true,
      participants: {
        select: { id: true, name: true, imageUrl: true },
      },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const signupsByParticipantId = await prisma.producerEventSignup.findMany({
    where: { eventId: event.id, participantId: { not: null } },
    select: { participantId: true, producer: { select: { slug: true } } },
  });
  const participantIdToSlug = new Map<string, string>();
  for (const s of signupsByParticipantId) {
    if (s.participantId) participantIdToSlug.set(s.participantId, s.producer.slug);
  }

  const participants = event.participants.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    producerSlug: participantIdToSlug.get(p.id) ?? null,
  }));

  return NextResponse.json({
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    venueName: event.venueName,
    address: event.address,
    city: event.city,
    state: event.state,
    zip: event.zip,
    eventStartsAt: event.eventStartsAt,
    eventEndsAt: event.eventEndsAt,
    participants,
  });
}
