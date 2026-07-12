"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

const TRAINER_LINKS = [
  { href: "/", label: "Prehľad" },
  { href: "/clients", label: "Klienti" },
  { href: "/calendar", label: "Kalendár" },
  { href: "/payments", label: "Platby" },
];

const CLIENT_LINKS = [
  { href: "/", label: "Prehľad" },
  { href: "/calendar", label: "Kalendár" },
];

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "TRAINER" ? TRAINER_LINKS : CLIENT_LINKS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white sm:hidden">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 py-2.5 text-center text-xs font-medium ${
              active ? "text-blue-600" : "text-slate-500"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
