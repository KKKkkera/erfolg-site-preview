import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { MobileAdminNav } from "@/components/admin/mobile-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

export function AdminShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
        <MobileAdminNav role={user.role || undefined} />
        <Link
          href="/admin"
          className="font-heading text-base font-semibold tracking-tight"
        >
          Эрфольг — админ
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <div className="hidden text-right leading-tight sm:block">
            <div className="font-medium">{user.name || user.email}</div>
            <div className="text-xs text-muted-foreground">
              {user.role === "OWNER" ? "Владелец" : "Редактор"}
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[240px] shrink-0 border-r bg-background lg:block">
          <div className="sticky top-14">
            <AdminNav role={user.role || undefined} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
