import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { SESSION_STATUS_LABELS, SESSION_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { NewPackageForm } from "./new-package-form";
import { NewPaymentForm } from "./new-payment-form";
import { ToggleActiveButton } from "./client-actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTrainer();
  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id, role: "CLIENT" },
    include: {
      packages: { orderBy: { createdAt: "desc" } },
      sessions: {
        orderBy: { startTime: "desc" },
        take: 10,
      },
      payments: {
        orderBy: { paidAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className="text-xs text-slate-500 hover:underline">
          ← Klienti
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{client.name}</h1>
            <p className="text-sm text-slate-500">
              {client.email}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          </div>
          <ToggleActiveButton clientId={client.id} active={client.active} />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Balíčky tréningov</h2>
        {client.packages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Žiadne balíčky.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {client.packages.map((pkg) => (
              <li key={pkg.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800">{pkg.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(Number(pkg.price), pkg.currency)} ·{" "}
                    {formatDate(pkg.purchasedAt)}
                  </p>
                </div>
                <span className="font-medium text-slate-900">
                  {pkg.remainingCredits} / {pkg.totalCredits}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <NewPackageForm clientId={client.id} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Tréningy</h2>
          <Link href="/calendar" className="text-xs text-blue-600 hover:underline">
            Kalendár →
          </Link>
        </div>
        {client.sessions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Žiadne tréningy.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {client.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-600">
                  {formatDate(s.startTime)} · {formatTime(s.startTime)}
                </span>
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

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Platby</h2>
        {client.payments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Žiadne platby.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {client.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-slate-700">{formatDate(p.paidAt)}</p>
                  <p className="text-xs text-slate-400">{PAYMENT_METHOD_LABELS[p.method]}</p>
                </div>
                <span className="font-medium text-slate-900">
                  {formatMoney(Number(p.amount), p.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <NewPaymentForm
            clientId={client.id}
            packages={client.packages.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>
      </section>
    </div>
  );
}
