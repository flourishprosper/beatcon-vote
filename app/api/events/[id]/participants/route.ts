import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const createSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  seed: z.number().int().min(1).optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const participants = await prisma.participant.findMany({
    where: { eventId: id },
    orderBy: [{ seed: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(participants);
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
  const participant = await prisma.participant.create({
    data: { ...parsed.data, eventId: id },
  });
  return NextResponse.json(participant);
}
