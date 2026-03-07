import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireProducer() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "producer" || !session.user.producerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function getProducerId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role === "producer" && session.user.producerId) {
    return session.user.producerId;
  }
  return null;
}
