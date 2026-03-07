import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      showState: true,
      rounds: {
        orderBy: { roundIndex: "asc" },
        include: {
          matchups: {
            orderBy: { orderInRound: "asc" },
            include: {
              participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } },
            },
          },
        },
      },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rounds = await Promise.all(
    event.rounds.map(async (r) => ({
      ...r,
      matchups: await Promise.all(
        r.matchups.map(async (m) => {
          const participantsWithVotes = await Promise.all(
            m.participants.map(async (mp) => {
              const voteCount = await prisma.vote.count({
                where: { matchupId: m.id, participantId: mp.participantId },
              });
              return { participant: mp.participant, voteCount };
            })
          );
          return {
            id: m.id,
            orderInRound: m.orderInRound,
            status: m.status,
            voteEndsAt: m.voteEndsAt,
            participantsWithVotes,
          };
        })
      ),
    }))
  );

  return NextResponse.json({
    event: { id: event.id, name: event.name },
    currentMatchupId: event.showState?.currentMatchupId ?? null,
    rounds,
  });
}
