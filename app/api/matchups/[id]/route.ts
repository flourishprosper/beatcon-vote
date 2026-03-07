import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const participantsInclude = {
  participants: { orderBy: { slotIndex: "asc" as const }, include: { participant: true } },
};

const updateSchema = z.object({
  orderInRound: z.number().int().min(0).optional(),
  participantIds: z.array(z.string().nullable()).optional(),
  status: z.enum(["pending", "live", "completed"]).optional(),
  voteEndsAt: z.string().datetime().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const matchup = await prisma.matchup.findUnique({
    where: { id },
    include: {
      round: true,
      event: true,
      _count: { select: { votes: true } },
      ...participantsInclude,
    },
  });
  if (!matchup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(matchup);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { participantIds, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (rest.voteEndsAt !== undefined) {
    data.voteEndsAt = rest.voteEndsAt ? new Date(rest.voteEndsAt) : null;
  }
  if (participantIds !== undefined) {
    await prisma.matchupParticipant.deleteMany({ where: { matchupId: id } });
    const creates = participantIds
      .map((participantId, slotIndex) => (participantId ? { participantId, slotIndex } : null))
      .filter((row): row is { participantId: string; slotIndex: number } => row !== null);
    if (creates.length > 0) {
      await prisma.matchupParticipant.createMany({
        data: creates.map((c) => ({ matchupId: id, participantId: c.participantId, slotIndex: c.slotIndex })),
      });
    }
  }
  const matchup = await prisma.matchup.findUnique({
    where: { id },
    include: participantsInclude,
  });
  return NextResponse.json(matchup);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  await prisma.matchup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
