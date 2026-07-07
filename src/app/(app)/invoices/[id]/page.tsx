import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { StatusBadge, StepStatusBadge } from "@/components/status-badge";
import { ApprovalActions } from "./approval-actions";
import { formatDistanceToNow } from "date-fns";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      submittedBy: true,
      threshold: true,
      approvals: { orderBy: { order: "asc" }, include: { approver: true } },
      activityLogs: { orderBy: { createdAt: "asc" }, include: { user: true } },
    },
  });

  if (!invoice) notFound();

  const currentStep = invoice.approvals.find((a) => a.status === "PENDING");
  const canAct =
    invoice.status === "PENDING" &&
    !!currentStep &&
    (currentStep.role === session.user.role || session.user.role === "ADMIN");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {invoice.invoiceNumber} — {invoice.vendorName}
            </h1>
            <p className="text-sm text-slate-500">
              Submitted by {invoice.submittedBy.name} on {invoice.createdAt.toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Detail label="Amount" value={`${invoice.amount.toString()} ${invoice.currency}`} />
          <Detail label="Issue date" value={invoice.issueDate.toLocaleDateString()} />
          <Detail
            label="Due date"
            value={invoice.dueDate ? invoice.dueDate.toLocaleDateString() : "—"}
          />
          <Detail label="Approval rule" value={invoice.threshold?.name ?? "—"} />
          {invoice.description && (
            <div className="col-span-full">
              <dt className="text-xs uppercase text-slate-400">Description</dt>
              <dd className="text-slate-700">{invoice.description}</dd>
            </div>
          )}
          {invoice.fileUrl && (
            <div className="col-span-full">
              <dt className="text-xs uppercase text-slate-400">Attachment</dt>
              <dd>
                <a
                  href={invoice.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {invoice.fileName ?? "View attachment"}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Approval steps</h2>
        <ol className="space-y-3">
          {invoice.approvals.map((step) => (
            <li key={step.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Step {step.order}: {step.role}
                </p>
                {step.approver && (
                  <p className="text-xs text-slate-500">
                    {step.status === "APPROVED" ? "Approved" : "Rejected"} by {step.approver.name}
                    {step.actedAt ? ` · ${formatDistanceToNow(step.actedAt, { addSuffix: true })}` : ""}
                  </p>
                )}
                {step.comment && <p className="mt-1 text-xs italic text-slate-500">&ldquo;{step.comment}&rdquo;</p>}
              </div>
              <StepStatusBadge status={step.status} />
            </li>
          ))}
        </ol>

        {canAct && currentStep && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <ApprovalActions invoiceId={invoice.id} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {invoice.activityLogs.map((log) => (
            <li key={log.id} className="flex justify-between border-b border-slate-50 pb-2 last:border-none">
              <span>
                <span className="font-medium text-slate-800">{log.user?.name ?? "System"}</span>{" "}
                {describeAction(log.action)}
                {log.meta ? ` — ${log.meta}` : ""}
              </span>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(log.createdAt, { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}

function describeAction(action: string) {
  switch (action) {
    case "SUBMITTED":
      return "submitted the invoice";
    case "STEP_APPROVED":
      return "approved their step";
    case "STEP_REJECTED":
      return "rejected their step";
    case "APPROVED":
      return "the invoice was fully approved";
    case "REJECTED":
      return "the invoice was rejected";
    default:
      return action;
  }
}
