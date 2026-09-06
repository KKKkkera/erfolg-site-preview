import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { allowRequest, requestIp } from "@/lib/rate-limit";

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
        if (!credentials?.email || !credentials.password || credentials.email.length > 200 || credentials.password.length > 200) return null;
        try {
          const email = credentials.email.toLowerCase().trim();
          const h = await headers();
          const ip = requestIp(h);
          if (!(await allowRequest("login-account", email, 10, 15 * 60_000))) return null;
          if (ip && !(await allowRequest("login-ip", ip, 50, 15 * 60_000))) return null;
          const user = await db.adminUser.findUnique({
            where: { email },
          });
          if (!user || !user.isActive) return null;
          const ok = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );
          if (!ok) return null;
          const loggedIn = await db.adminUser
            .updateMany({
              where: { id: user.id, updatedAt: user.updatedAt, passwordHash: user.passwordHash, isActive: true },
              data: { lastLoginAt: new Date(), updatedAt: user.updatedAt },
            });
          if (loggedIn.count !== 1) return null;
          // Вход — в аудит-лог (фильтр «login» в экспорте существовал,
          // но события никто не писал). headers() внутри try: authorize
          // выполняется в route-handler'е, но перестраховываемся.
          try {
            const h = await headers();
            await logAdminAction({
              adminId: user.id,
              action: "login",
              entity: "AdminUser",
              entityId: user.id,
              ip: requestIp(h),
              userAgent: h.get("user-agent") ?? null,
            });
          } catch {
            await logAdminAction({
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
            sessionVersion: user.updatedAt.toISOString(),
          };
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
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      if (!token.id || token.sessionVersion === undefined) return {};
      // Run on every server session check; fail closed if the database is down.
      const current = await db.adminUser.findUnique({
        where: { id: token.id },
        select: { isActive: true, role: true, updatedAt: true, name: true, email: true },
      });
      if (!current?.isActive || current.updatedAt.toISOString() !== token.sessionVersion) return {};
      token.role = current.role;
      token.name = current.name;
      token.email = current.email;
      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role) {
        delete session.user;
      } else if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
