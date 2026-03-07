import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { broadcast } from "@/lib/sse";

const updateSchema = z.object({
  currentMatchupId: z.string().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const showState = await prisma.showState.findUnique({
    where: { eventId: id },
  });
  if (!showState) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(showState);
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
  const showState = await prisma.showState.upsert({
    where: { eventId: id },
    update: {
      currentMatchupId: parsed.data.currentMatchupId,
      updatedAt: new Date(),
    },
    create: { eventId: id, currentMatchupId: parsed.data.currentMatchupId ?? undefined },
  });
  broadcast(id, { type: "showState", currentMatchupId: showState.currentMatchupId });
  return NextResponse.json(showState);
}
