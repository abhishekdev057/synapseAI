"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Home, LifeBuoy, Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/patient", label: "Home", icon: Home, exact: true },
  { href: "/patient/games", label: "Games", icon: Gamepad2 },
  { href: "/patient/reminders", label: "Reminders", icon: Bell },
  { href: "/patient/people", label: "Family", icon: Users },
  { href: "/", label: "Help", icon: LifeBuoy },
];

export function PatientBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-3xl items-stretch justify-between px-2 py-1.5">
        {ITEMS.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "sy-press flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition-colors",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-16 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <it.icon className="h-6 w-6" strokeWidth={active ? 2.6 : 1.9} />
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
