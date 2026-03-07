import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { broadcast } from "@/lib/sse";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;

  const nextRound = await prisma.round.findFirst({
    where: { eventId, status: "upcoming" },
    orderBy: { roundIndex: "asc" },
    include: {
      matchups: { orderBy: { orderInRound: "asc" }, take: 1 },
    },
  });

  if (!nextRound) {
    return NextResponse.json(
      {
        error:
          "There is no upcoming round. Go to Rounds, open the round you just finished, and click \"Finalize & create next round\" to create the next round from the winners. Then come back and click \"Start next round\" again.",
      },
      { status: 400 }
    );
  }

  if (nextRound.matchups.length === 0) {
    return NextResponse.json(
      {
        error: `"${nextRound.label}" is upcoming but has no matchups. Go to Rounds and add matchups to this round, or use \"Finalize & create next round\" on the previous round to build the next round from winners.`,
      },
      { status: 400 }
    );
  }

  const firstMatchupId = nextRound.matchups[0].id;

  await prisma.round.update({
    where: { id: nextRound.id },
    data: { status: "live" },
  });

  const showState = await prisma.showState.upsert({
    where: { eventId },
    update: { currentMatchupId: firstMatchupId, updatedAt: new Date() },
    create: { eventId, currentMatchupId: firstMatchupId },
  });

  broadcast(eventId, { type: "showState", currentMatchupId: showState.currentMatchupId });

  return NextResponse.json({
    roundId: nextRound.id,
    currentMatchupId: firstMatchupId,
    showState,
  });
}
