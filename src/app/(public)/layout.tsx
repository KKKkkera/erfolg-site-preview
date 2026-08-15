import type { ReactNode } from "react";

import { MaintenanceBanner } from "@/components/public/maintenance-banner";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Toaster } from "@/components/ui/sonner";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* WCAG 2.4.1 (уровень A): пропустить шапку и уйти сразу к контенту.
          Виден только при фокусе с клавиатуры. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      >
        Перейти к основному содержанию
      </a>
      <MaintenanceBanner />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}
