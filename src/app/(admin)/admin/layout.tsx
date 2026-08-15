import { Toaster } from "@/components/ui/sonner";
import { NextAuthSessionProvider } from "@/components/admin/session-provider";

export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <div className="min-h-screen bg-muted/30 text-foreground">{children}</div>
      <Toaster richColors closeButton position="top-right" />
    </NextAuthSessionProvider>
  );
}
