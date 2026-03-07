import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const VOTER_COOKIE = "beatcon_voter_id";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchupId } = await params;
  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: {
      event: true,
      round: true,
      participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } },
    },
  });
  if (!matchup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const votingOpen =
    (matchup.status === "live" || matchup.status === "pending") &&
    (!matchup.voteEndsAt || now < matchup.voteEndsAt);

  const cookieStore = await cookies();
  const voterId = cookieStore.get(VOTER_COOKIE)?.value;
  let existingVote: { participantId: string } | null = null;
  let votesUsed = 0;
  if (voterId) {
    const vote = await prisma.vote.findUnique({
      where: {
        matchupId_voterIdentityId: { matchupId, voterIdentityId: voterId },
      },
    });
    if (vote) {
      existingVote = { participantId: vote.participantId };
      votesUsed = 1;
    }
  }

  const participantsWithVotes = await Promise.all(
    matchup.participants.map(async (mp) => {
      const voteCount = await prisma.vote.count({
        where: { matchupId, participantId: mp.participantId },
      });
      return { participant: mp.participant, voteCount };
    })
  );

  return NextResponse.json({
    matchup: {
      id: matchup.id,
      status: matchup.status,
      voteEndsAt: matchup.voteEndsAt,
      participants: participantsWithVotes.map(({ participant }) => participant),
      round: matchup.round,
    },
    event: {
      id: matchup.event.id,
      name: matchup.event.name,
      maxVotesPerUser: matchup.event.maxVotesPerUser,
    },
    votingOpen,
    participantsWithVotes,
    signedIn: !!voterId,
    existingVote: existingVote?.participantId ?? null,
    votesUsed,
  });
}
