import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        try {
          const user = await db.adminUser.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });
          if (!user || !user.isActive) return null;
          const ok = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );
          if (!ok) return null;
          await db.adminUser
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});
          // Вход — в аудит-лог (фильтр «login» в экспорте существовал,
          // но события никто не писал). headers() внутри try: authorize
          // выполняется в route-handler'е, но перестраховываемся.
          try {
            const h = await headers();
            void logAdminAction({
              adminId: user.id,
              action: "login",
              entity: "AdminUser",
              entityId: user.id,
              ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
              userAgent: h.get("user-agent") ?? null,
            });
          } catch {
            void logAdminAction({
              adminId: user.id,
              action: "login",
              entity: "AdminUser",
              entityId: user.id,
            });
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as unknown as User;
        } catch (e) {
          console.error("auth.authorize error", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User & { role?: "OWNER" | "EDITOR" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role =
          (token.role as "OWNER" | "EDITOR" | undefined) ?? "EDITOR";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
