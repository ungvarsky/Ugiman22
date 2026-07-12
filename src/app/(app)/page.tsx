import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { SESSION_STATUS_LABELS, SESSION_STATUS_STYLES } from "@/lib/labels";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === "TRAINER") {
    return <TrainerDashboard />;
  }
  return <ClientDashboard clientId={session.user.id} />;
}

async function TrainerDashboard() {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeClients, sessionsThisWeek, lowCreditPackages, paymentsThisMonth, upcoming] =
    await Promise.all([
      prisma.user.count({ where: { role: "CLIENT", active: true } }),
      prisma.trainingSession.count({
        where: { startTime: { gte: now, lte: weekEnd }, status: "SCHEDULED" },
      }),
      prisma.trainingPackage.findMany({
        where: { remainingCredits: { lte: 2 } },
        include: { client: true },
        orderBy: { remainingCredits: "asc" },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.trainingSession.findMany({
        where: { startTime: { gte: now }, status: "SCHEDULED" },
        include: { client: true },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Prehľad</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Aktívni klienti" value={String(activeClients)} />
        <StatCard label="Tréningy tento týždeň" value={String(sessionsThisWeek)} />
        <StatCard
          label="Tento mesiac vybrané"
          value={formatMoney(Number(paymentsThisMonth._sum.amount ?? 0))}
        />
        <StatCard label="Nízky kredit" value={String(lowCreditPackages.length)} />
      </div>

      {lowCreditPackages.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">
            Klienti s nízkym kreditom
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {lowCreditPackages.map((pkg) => (
              <li key={pkg.id}>
                <Link href={`/clients/${pkg.clientId}`} className="underline">
                  {pkg.client.name}
                </Link>{" "}
                — {pkg.name}: {pkg.remainingCredits} tréning(y) zostáva
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Najbližšie tréningy
          </h2>
          <Link href="/calendar" className="text-xs text-blue-600 hover:underline">
            Kalendár →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Žiadne naplánované tréningy.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{s.client.name}</p>
                  <p className="text-slate-500">
                    {formatDate(s.startTime)} · {formatTime(s.startTime)}–
                    {formatTime(s.endTime)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${SESSION_STATUS_STYLES[s.status]}`}
                >
                  {SESSION_STATUS_LABELS[s.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function ClientDashboard({ clientId }: { clientId: string }) {
  const now = new Date();

  const [packages, nextSession, recentPayments] = await Promise.all([
    prisma.trainingPackage.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainingSession.findFirst({
      where: { clientId, startTime: { gte: now }, status: "SCHEDULED" },
      orderBy: { startTime: "asc" },
    }),
    prisma.payment.findMany({
      where: { clientId },
      orderBy: { paidAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Môj prehľad</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Najbližší tréning</h2>
        {nextSession ? (
          <p className="mt-2 text-sm text-slate-700">
            {formatDate(nextSession.startTime)} · {formatTime(nextSession.startTime)}–
            {formatTime(nextSession.endTime)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Zatiaľ nemáte naplánovaný tréning.</p>
        )}
        <Link href="/calendar" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
          Zobraziť kalendár →
        </Link>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Moje balíčky</h2>
        {packages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Zatiaľ nemáte žiadny balíček.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {packages.map((pkg) => (
              <li key={pkg.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{pkg.name}</span>
                <span className="font-medium text-slate-900">
                  {pkg.remainingCredits} / {pkg.totalCredits} tréningov
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Posledné platby</h2>
        {recentPayments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Žiadne platby.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-600">{formatDate(p.paidAt)}</span>
                <span className="font-medium text-slate-900">
                  {formatMoney(Number(p.amount), p.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
