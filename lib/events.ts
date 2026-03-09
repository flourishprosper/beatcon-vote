import { prisma } from "@/lib/db";

const UPCOMING_LIMIT = 10;

export type UpcomingEvent = {
  id: string;
  name: string;
  slug: string;
  eventStartsAt: Date | null;
  eventEndsAt: Date | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
};

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { eventStartsAt: { gte: now } },
        { eventStartsAt: null },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      eventStartsAt: true,
      eventEndsAt: true,
      venueName: true,
      city: true,
      state: true,
    },
    orderBy: [{ eventStartsAt: "asc" }, { createdAt: "asc" }],
    take: UPCOMING_LIMIT,
  });
  return events;
}
