import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
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

export function NavBar({
  user,
}: {
  user: { name?: string | null; role: Role };
}) {
  const links = user.role === "TRAINER" ? TRAINER_LINKS : CLIENT_LINKS;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            Trener<span className="text-blue-600">App</span>
          </Link>
          <nav className="hidden gap-4 text-sm text-slate-600 sm:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs text-slate-500 sm:block">
            <p className="font-medium text-slate-700">{user.name}</p>
            <p>{user.role === "TRAINER" ? "Tréner" : "Klient"}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
