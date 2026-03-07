import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subscribe } from "@/lib/sse";
import { getPublicState } from "@/lib/public-state";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const listener = (data: string) => {
        try {
          controller.enqueue(`data: ${data}\n\n`);
        } catch (_) {}
      };
      const unsubscribe = subscribe(eventId, listener);

      const state = await getPublicState(eventId);
      if (state) {
        controller.enqueue(`data: ${JSON.stringify({ type: "state", ...state })}\n\n`);
      }

      req.signal?.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
