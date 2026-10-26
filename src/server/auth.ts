import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "@/server/db/client";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import { roleForEmail } from "@/server/permissions";

export type UserRole = (typeof users.$inferSelect)["role"];

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
}

export const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Сессии хранятся в БД (таблица sessions), cookie содержит только случайный токен.
// Адрес возврата после Google ограничен: Auth.js пускает только URL своего же origin,
// а Google — только redirect URI из списка в Google Cloud Console.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  adapter: DrizzleAdapter(await getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: UserRole }).role ?? "customer";
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id || roleForEmail(user.email) !== "admin") return;
      const db = await getDb();
      await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
    },
  },
}));
