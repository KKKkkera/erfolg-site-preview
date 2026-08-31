"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Box,
  FileText,
  FolderTree,
  Hammer,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  MapPin,
  MessageSquareQuote,
  Newspaper,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  children?: { href: string; label: string }[];
  ownerOnly?: boolean;
};

const NAV: Item[] = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Товары", icon: Box },
  { href: "/admin/categories", label: "Категории", icon: FolderTree },
  { href: "/admin/brands", label: "Бренды", icon: Award },
  {
    href: "/admin/requests",
    label: "Заявки",
    icon: Inbox,
    children: [
      { href: "/admin/requests/quote", label: "КП" },
      { href: "/admin/requests/service", label: "Сервис" },
      { href: "/admin/requests/contact", label: "Контакт" },
    ],
  },
  { href: "/admin/reviews", label: "Отзывы", icon: MessageSquareQuote },
  { href: "/admin/works", label: "Наши работы", icon: Hammer },
  { href: "/admin/pages", label: "Страницы", icon: FileText },
  { href: "/admin/regions", label: "Регионы", icon: MapPin },
  { href: "/admin/blog", label: "Блог", icon: Newspaper },
  { href: "/admin/media", label: "Медиатека", icon: ImageIcon },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
  { href: "/admin/users", label: "Пользователи", icon: Users, ownerOnly: true },
  { href: "/admin/audit", label: "Аудит", icon: ScrollText, ownerOnly: true },
];

export function AdminNav({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role?: string;
}) {
  const pathname = usePathname() || "";

  const items = NAV.filter((it) => !it.ownerOnly || role === "OWNER");

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
            {item.children && active ? (
              <div className="ml-9 mt-0.5 flex flex-col gap-0.5 border-l pl-3">
                {item.children.map((child) => {
                  const childActive =
                    pathname === child.href ||
                    pathname.startsWith(`${child.href}/`);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "rounded px-2 py-1 text-xs transition-colors",
                        childActive
                          ? "font-medium text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
