import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const bodySchema = z.object({
  label: z.string().min(1).optional().default("Round 1"),
});

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const existingRounds = await prisma.round.count({ where: { eventId } });
  if (existingRounds > 0) {
    return NextResponse.json(
      { error: "Event already has rounds. Generate initial round only when there are no rounds." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const label = parsed.success ? parsed.data.label : "Round 1";

  const n = event.participantsPerMatchup;
  if (event.participants.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 participants to generate a round." },
      { status: 400 }
    );
  }

  const shuffled = shuffle(event.participants);
  const chunks: string[][] = [];
  for (let i = 0; i < shuffled.length; i += n) {
    chunks.push(shuffled.slice(i, i + n).map((p) => p.id));
  }

  const round = await prisma.round.create({
    data: { eventId, roundIndex: 0, label, status: "upcoming" },
  });

  for (let orderInRound = 0; orderInRound < chunks.length; orderInRound++) {
    const participantIds = chunks[orderInRound];
    const matchup = await prisma.matchup.create({
      data: {
        eventId,
        roundId: round.id,
        orderInRound,
        status: "pending",
        participants: {
          create: participantIds.map((participantId, slotIndex) => ({ participantId, slotIndex })),
        },
      },
    });
  }

  const roundWithMatchups = await prisma.round.findUnique({
    where: { id: round.id },
    include: {
      matchups: {
        orderBy: { orderInRound: "asc" },
        include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } },
      },
    },
  });

  return NextResponse.json(roundWithMatchups);
}
