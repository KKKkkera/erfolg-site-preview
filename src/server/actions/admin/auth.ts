"use server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "EDITOR";
};

export async function requireAdmin(): Promise<AdminSessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as AdminSessionUser;
}

export async function requireOwner(): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (user.role !== "OWNER") throw new Error("Forbidden");
  return user;
}
