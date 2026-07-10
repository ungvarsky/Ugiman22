import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@prisma/client";

export async function NavBar({
  user,
}: {
  user: { id: string; name?: string | null; role: Role };
}) {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            Hana Trans <span className="font-normal text-slate-400">· Invoice Approval</span>
          </Link>
          <nav className="hidden gap-4 text-sm text-slate-600 sm:flex">
            <Link href="/" className="hover:text-slate-900">Dashboard</Link>
            <Link href="/invoices" className="hover:text-slate-900">Invoices</Link>
            <Link href="/invoices/new" className="hover:text-slate-900">New Invoice</Link>
            {user.role === "ADMIN" && (
              <>
                <Link href="/admin/users" className="hover:text-slate-900">Users</Link>
                <Link href="/admin/approval-rules" className="hover:text-slate-900">Approval Rules</Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell
            notifications={notifications.map((n) => ({
              id: n.id,
              message: n.message,
              link: n.link,
              read: n.read,
              createdAt: n.createdAt.toISOString(),
            }))}
            unreadCount={unreadCount}
          />
          <div className="hidden text-right text-xs text-slate-500 sm:block">
            <p className="font-medium text-slate-700">{user.name}</p>
            <p>{user.role}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
