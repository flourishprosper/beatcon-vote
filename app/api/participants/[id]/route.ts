import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  seed: z.number().int().min(1).optional().nullable(),
});

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
  const participant = await prisma.participant.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(participant);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const [inMatchups, voteCount] = await Promise.all([
    prisma.matchupParticipant.count({ where: { participantId: id } }),
    prisma.vote.count({ where: { participantId: id } }),
  ]);
  if (inMatchups > 0 || voteCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a participant who is in a matchup or has received votes. Remove them from matchups first." },
      { status: 400 }
    );
  }
  await prisma.participant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
