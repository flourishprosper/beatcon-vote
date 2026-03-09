import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/events";

export async function GET() {
  const events = await getUpcomingEvents();
  return NextResponse.json(events);
}
