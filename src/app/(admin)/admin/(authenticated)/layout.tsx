import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { AdminShell } from "@/components/admin/admin-shell";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) {
    redirect("/admin/login");
  }
  return <AdminShell user={session.user}>{children}</AdminShell>;
}
