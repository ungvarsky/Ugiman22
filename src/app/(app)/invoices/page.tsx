import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import type { InvoiceStatus } from "@prisma/client";

const STATUS_FILTERS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSession();
  const { status } = await searchParams;
  const filter = status && status !== "ALL" ? (status as InvoiceStatus) : undefined;

  const invoices = await prisma.invoice.findMany({
    where: filter ? { status: filter } : { status: { not: "DRAFT" } },
    include: { submittedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Invoice
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "ALL" ? "/invoices" : `/invoices?status=${f.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              (status ?? "ALL") === f.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Submitted by</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-blue-600 hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">{inv.vendorName}</td>
                <td className="px-4 py-2">
                  {inv.amount.toString()} {inv.currency}
                </td>
                <td className="px-4 py-2">{inv.submittedBy.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {inv.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
