import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

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
  _req: Request,
  _context: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  return NextResponse.json(
    {
      error:
        "Participants can only be added from producer signups. Use the Producer signups section on the event page.",
    },
    { status: 400 }
  );
}
