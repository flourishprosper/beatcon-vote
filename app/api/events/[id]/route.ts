import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

const lenientUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((v): string | null => {
    if (v == null || typeof v !== "string" || v.trim() === "") return null;
    return isValidUrl(v) ? v : null;
  });

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  maxVotesPerUser: z.number().int().min(1).optional(),
  participantsPerMatchup: z.number().int().min(2).optional(),
  advancesPerMatchup: z.number().int().min(1).optional(),
  acceptsProducerRegistration: z.boolean().optional(),
  description: z.string().optional().nullable(),
  imageUrl: lenientUrl,
  venueName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  eventStartsAt: z.union([z.string(), z.date()]).optional().nullable(),
  eventEndsAt: z.union([z.string(), z.date()]).optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participants: true,
      rounds: { orderBy: { roundIndex: "asc" }, include: { matchups: { orderBy: { orderInRound: "asc" }, include: { participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } } } } } },
      showState: true,
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
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
  const d = parsed.data;
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...d,
      ...(d.eventStartsAt !== undefined && {
        eventStartsAt: d.eventStartsAt == null ? null : new Date(d.eventStartsAt),
      }),
      ...(d.eventEndsAt !== undefined && {
        eventEndsAt: d.eventEndsAt == null ? null : new Date(d.eventEndsAt),
      }),
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
