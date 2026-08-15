import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { LoginForm } from "@/components/admin/login-form";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Вход в админку — Эрфольг",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
