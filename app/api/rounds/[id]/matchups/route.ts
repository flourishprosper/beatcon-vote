import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const participantsInclude = {
  participants: { orderBy: { slotIndex: "asc" as const }, include: { participant: true } },
};

const createSchema = z.object({
  orderInRound: z.number().int().min(0),
  participantIds: z.array(z.string().nullable()).optional(), // slot index = array index; null = empty slot
  status: z.enum(["pending", "live", "completed"]).optional().default("pending"),
  voteEndsAt: z.string().datetime().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const matchups = await prisma.matchup.findMany({
    where: { roundId: id },
    orderBy: { orderInRound: "asc" },
    include: participantsInclude,
  });
  return NextResponse.json(matchups);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const round = await prisma.round.findUnique({ where: { id }, include: { event: true } });
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const participantIds = parsed.data.participantIds ?? [];
  const matchup = await prisma.matchup.create({
    data: {
      roundId: id,
      eventId: round.eventId,
      orderInRound: parsed.data.orderInRound,
      status: parsed.data.status,
      voteEndsAt: parsed.data.voteEndsAt ? new Date(parsed.data.voteEndsAt) : undefined,
      participants: {
        create: participantIds
          .map((participantId, slotIndex) => (participantId ? { participantId, slotIndex } : null))
          .filter((row): row is { participantId: string; slotIndex: number } => row !== null),
      },
    },
    include: participantsInclude,
  });
  return NextResponse.json(matchup);
}
