import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: "/admin/login", error: "/admin/login" },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = (user as { role?: "admin" | "producer" }).role;
        token.producerId = (user as { producerId?: string }).producerId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = (token.email as string) ?? "";
        session.user.role = token.role as "admin" | "producer" | undefined;
        session.user.producerId = token.producerId as string | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" as const },
};
