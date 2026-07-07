import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NewThresholdForm } from "./new-threshold-form";
import { DeleteThresholdButton } from "./delete-threshold-button";

export default async function ApprovalRulesPage() {
  await requireAdmin();
  const thresholds = await prisma.approvalThreshold.findMany({
    include: { levels: { orderBy: { order: "asc" } } },
    orderBy: { minAmount: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Approval rules</h1>
        <p className="text-sm text-slate-500">
          Invoices are routed through the rule whose amount range they fall into, in order.
        </p>
      </div>

      <div className="space-y-3">
        {thresholds.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500">
                {t.minAmount.toString()} – {t.maxAmount ? t.maxAmount.toString() : "∞"} {t.currency} ·{" "}
                {t.levels.map((l) => l.role).join(" → ")}
              </p>
            </div>
            <DeleteThresholdButton id={t.id} />
          </div>
        ))}
        {thresholds.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            No approval rules configured yet. Invoices cannot be submitted until at least one exists.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Add rule</h2>
        <NewThresholdForm />
      </div>
    </div>
  );
}
