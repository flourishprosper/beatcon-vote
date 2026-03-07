import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { prisma } = await import("./db");
        const admin = await prisma.admin.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!admin) return null;
        const ok = await compare(String(credentials.password), admin.password);
        if (!ok) return null;
        return { id: admin.id, email: admin.email };
      },
    }),
  ],
});
