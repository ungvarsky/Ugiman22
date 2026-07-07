import type { ApprovalStepStatus, InvoiceStatus } from "@prisma/client";

const INVOICE_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STYLES[status]}`}>
      {status}
    </span>
  );
}

const STEP_STYLES: Record<ApprovalStepStatus, string> = {
  WAITING: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SKIPPED: "bg-slate-100 text-slate-400",
};

export function StepStatusBadge({ status }: { status: ApprovalStepStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STEP_STYLES[status]}`}>
      {status}
    </span>
  );
}
