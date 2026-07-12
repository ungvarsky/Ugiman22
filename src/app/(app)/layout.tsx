import { requireSession } from "@/lib/session";
import { NavBar } from "@/components/nav-bar";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-slate-50 pb-16 sm:pb-0">
      <NavBar user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <BottomNav role={session.user.role} />
    </div>
  );
}
