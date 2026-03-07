import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const bodySchema = z.object({
  nextRoundLabel: z.string().min(1).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId, roundId } = await params;

  const round = await prisma.round.findUnique({
    where: { id: roundId, eventId },
    include: {
      event: true,
      matchups: {
        orderBy: { orderInRound: "asc" },
        include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } },
      },
    },
  });
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const nextRoundLabel = parsed.success && parsed.data.nextRoundLabel
    ? parsed.data.nextRoundLabel
    : `Round ${round.roundIndex + 2}`;

  const advancesPerMatchup = round.event.advancesPerMatchup;
  const participantsPerMatchup = round.event.participantsPerMatchup;

  const winners: string[] = [];
  for (const m of round.matchups) {
    const voteCounts = await Promise.all(
      m.participants.map(async (mp) => ({
        participantId: mp.participantId,
        participant: mp.participant,
        voteCount: await prisma.vote.count({
          where: { matchupId: m.id, participantId: mp.participantId },
        }),
      }))
    );
    // Tie-break: most votes first, then lower seed, then stable by id
    voteCounts.sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      const seedA = a.participant.seed ?? 9999;
      const seedB = b.participant.seed ?? 9999;
      if (seedA !== seedB) return seedA - seedB;
      return a.participantId.localeCompare(b.participantId);
    });
    const top = voteCounts.slice(0, advancesPerMatchup);
    winners.push(...top.map((t) => t.participantId));
  }

  if (winners.length === 0) {
    return NextResponse.json(
      { error: "No winners to advance. Ensure matchups have participants and votes." },
      { status: 400 }
    );
  }

  const nextRound = await prisma.round.create({
    data: {
      eventId,
      roundIndex: round.roundIndex + 1,
      label: nextRoundLabel,
      status: "upcoming",
      resultsVisible: false,
    },
  });

  for (let i = 0; i < winners.length; i += participantsPerMatchup) {
    const chunk = winners.slice(i, i + participantsPerMatchup);
    await prisma.matchup.create({
      data: {
        eventId,
        roundId: nextRound.id,
        orderInRound: Math.floor(i / participantsPerMatchup),
        status: "pending",
        participants: {
          create: chunk.map((participantId, slotIndex) => ({ participantId, slotIndex })),
        },
      },
    });
  }

  await prisma.round.update({
    where: { id: roundId },
    data: { status: "completed", resultsVisible: true },
  });

  const nextRoundWithMatchups = await prisma.round.findUnique({
    where: { id: nextRound.id },
    include: {
      matchups: {
        orderBy: { orderInRound: "asc" },
        include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } },
      },
    },
  });

  return NextResponse.json({
    finalizedRoundId: roundId,
    nextRound: nextRoundWithMatchups,
  });
}
