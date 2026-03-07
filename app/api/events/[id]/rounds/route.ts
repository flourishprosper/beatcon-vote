import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const createSchema = z.object({
  roundIndex: z.number().int().min(0),
  label: z.string().min(1),
  status: z.enum(["upcoming", "live", "completed"]).optional().default("upcoming"),
  resultsVisible: z.boolean().optional().default(false),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const rounds = await prisma.round.findMany({
    where: { eventId: id },
    orderBy: { roundIndex: "asc" },
    include: { matchups: { orderBy: { orderInRound: "asc" }, include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } } } },
  });
  return NextResponse.json(rounds);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const round = await prisma.round.create({
    data: { ...parsed.data, eventId: id },
    include: { matchups: { orderBy: { orderInRound: "asc" }, include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } } } },
  });
  return NextResponse.json(round);
}
