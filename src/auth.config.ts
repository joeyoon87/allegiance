import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config — no providers that touch Prisma.
 * next-auth's standard Credentials provider (and therefore any DB access)
 * lives only in src/auth.ts, which is never imported by middleware.
 * Middleware runs on the Edge runtime, and Prisma's default client needs
 * Node.js APIs it doesn't have there.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/portal/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
