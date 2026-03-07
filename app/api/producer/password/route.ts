import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireProducer, getProducerId } from "@/lib/auth-producer";

const updateSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: Request) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: { passwordHash: true },
  });
  if (!producer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await compare(parsed.data.currentPassword, producer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await prisma.producer.update({
    where: { id: producerId },
    data: { passwordHash },
  });
  return NextResponse.json({ success: true });
}
