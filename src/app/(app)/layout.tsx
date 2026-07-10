import { requireSession } from "@/lib/session";
import { NavBar } from "@/components/nav-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar user={session.user} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
