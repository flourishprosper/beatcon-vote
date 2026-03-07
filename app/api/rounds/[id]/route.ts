import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const updateSchema = z.object({
  roundIndex: z.number().int().min(0).optional(),
  label: z.string().min(1).optional(),
  status: z.enum(["upcoming", "live", "completed"]).optional(),
  resultsVisible: z.boolean().optional(),
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
  const round = await prisma.round.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(round);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  await prisma.round.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
