import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host")}`
    : req.headers.get("origin") ?? "http://localhost:3000";
  const voteUrl = `${origin}/vote/current?eventId=${eventId}`;

  const png = await QRCode.toBuffer(voteUrl, { width: 400, margin: 2 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
