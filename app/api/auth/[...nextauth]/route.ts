import { handlers } from "@/lib/auth";
import { NextResponse } from "next/server";

const { GET: authGet, POST: authPost } = handlers;

type AuthHandler = (req: Request, context?: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>;

function wrap(handler: AuthHandler): AuthHandler {
  return async (req, context) => {
    if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
      console.error("NEXTAUTH_SECRET (or AUTH_SECRET) is not set. Set it in Netlify environment variables.");
      return NextResponse.json(
        { error: "Server misconfiguration: auth secret not set" },
        { status: 503 }
      );
    }
    try {
      return await handler(req, context);
    } catch (e) {
      console.error("NextAuth error:", e);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

export const GET = wrap(authGet as AuthHandler);
export const POST = wrap(authPost as AuthHandler);
