import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const session = await requireSession();

  const [pendingForMe, myInvoices, stats] = await Promise.all([
    session.user.role === "ADMIN"
      ? prisma.invoice.findMany({
          where: { status: "PENDING", approvals: { some: { status: "PENDING" } } },
          include: { submittedBy: true, approvals: true },
          orderBy: { createdAt: "asc" },
        })
      : prisma.invoice.findMany({
          where: {
            status: "PENDING",
            approvals: { some: { status: "PENDING", role: session.user.role } },
          },
          include: { submittedBy: true, approvals: true },
          orderBy: { createdAt: "asc" },
        }),
    prisma.invoice.findMany({
      where: { submittedById: session.user.id, status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      _count: true,
      where: { status: { not: "DRAFT" } },
    }),
  ]);

  const statusCounts = Object.fromEntries(stats.map((s) => [s.status, s._count]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-lg font-semibold text-slate-900">
          Welcome, {session.user.name}
        </h1>
        <p className="text-sm text-slate-500">Role: {session.user.role}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending" value={statusCounts.PENDING ?? 0} color="text-amber-600" />
        <StatCard label="Approved" value={statusCounts.APPROVED ?? 0} color="text-green-600" />
        <StatCard label="Rejected" value={statusCounts.REJECTED ?? 0} color="text-red-600" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Awaiting your approval ({pendingForMe.length})
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {pendingForMe.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing pending. 🎉</p>
          ) : (
            <ul>
              {pendingForMe.map((inv) => (
                <li key={inv.id} className="border-b border-slate-50 px-4 py-3 last:border-none">
                  <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        {inv.vendorName} · {inv.amount.toString()} {inv.currency} · submitted by{" "}
                        {inv.submittedBy.name}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Your recent invoices</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {myInvoices.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              You haven&apos;t submitted any invoices yet.
            </p>
          ) : (
            <ul>
              {myInvoices.map((inv) => (
                <li key={inv.id} className="border-b border-slate-50 px-4 py-3 last:border-none">
                  <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        {inv.vendorName} · {inv.amount.toString()} {inv.currency}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
