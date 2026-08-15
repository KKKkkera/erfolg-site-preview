"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNav } from "@/components/admin/admin-nav";

export function MobileAdminNav({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Эрфольг — админ</SheetTitle>
        </SheetHeader>
        <AdminNav onNavigate={() => setOpen(false)} role={role} />
      </SheetContent>
    </Sheet>
  );
}
