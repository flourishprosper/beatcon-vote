import { prisma } from "@/lib/db";

export async function getPublicState(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { showState: true },
  });
  if (!event) return null;

  let currentMatchup: Awaited<ReturnType<typeof prisma.matchup.findUnique>> = null;
  if (event.showState?.currentMatchupId) {
    currentMatchup = await prisma.matchup.findUnique({
      where: { id: event.showState.currentMatchupId },
      include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } }, round: true },
    });
  }

  return {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      maxVotesPerUser: event.maxVotesPerUser,
    },
    currentMatchupId: event.showState?.currentMatchupId ?? null,
    currentMatchup,
  };
}
