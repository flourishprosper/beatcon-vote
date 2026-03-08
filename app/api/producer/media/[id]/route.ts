import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProducer, getProducerId } from "@/lib/auth-producer";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.producerMedia.findFirst({
    where: { id, producerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.producerMedia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
