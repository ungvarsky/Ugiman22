import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { NewPaymentForm } from "./new-payment-form";

export default async function PaymentsPage() {
  await requireTrainer();

  const [payments, clients, packages, totalThisMonth] = await Promise.all([
    prisma.payment.findMany({
      include: { client: true },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "CLIENT", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.trainingPackage.findMany({
      select: { id: true, name: true, clientId: true },
    }),
    prisma.payment.aggregate({
      where: {
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Platby</h1>
        <span className="text-sm text-slate-500">
          Tento mesiac: {formatMoney(Number(totalThisMonth._sum.amount ?? 0))}
        </span>
      </div>

      <NewPaymentForm clients={clients} packages={packages} />

      <ul className="space-y-2">
        {payments.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{p.client.name}</p>
              <p className="text-xs text-slate-500">
                {formatDate(p.paidAt)} · {PAYMENT_METHOD_LABELS[p.method]}
                {p.note ? ` · ${p.note}` : ""}
              </p>
            </div>
            <span className="text-sm font-medium text-slate-900">
              {formatMoney(Number(p.amount), p.currency)}
            </span>
          </li>
        ))}
        {payments.length === 0 && (
          <p className="text-sm text-slate-500">Zatiaľ žiadne platby.</p>
        )}
      </ul>
    </div>
  );
}
