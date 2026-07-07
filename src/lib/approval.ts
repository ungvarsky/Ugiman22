import { prisma } from "@/lib/prisma";
import { Prisma, Role, ApprovalStepStatus, InvoiceStatus, NotificationType } from "@prisma/client";
import { sendNotification } from "@/lib/notifications";

export class ApprovalError extends Error {}

export async function findThresholdForAmount(amount: Prisma.Decimal | number) {
  const value = new Prisma.Decimal(amount);
  const thresholds = await prisma.approvalThreshold.findMany({
    include: { levels: { orderBy: { order: "asc" } } },
    orderBy: { minAmount: "asc" },
  });

  return thresholds.find((t) => {
    const min = new Prisma.Decimal(t.minAmount);
    const max = t.maxAmount ? new Prisma.Decimal(t.maxAmount) : null;
    return value.gte(min) && (max === null || value.lte(max));
  });
}

/**
 * Moves a draft invoice into the approval workflow: resolves the matching
 * amount threshold, creates the ordered approval steps, and activates the
 * first one.
 */
export async function submitInvoiceForApproval(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });

  if (invoice.status !== InvoiceStatus.DRAFT) {
    throw new ApprovalError("Only draft invoices can be submitted.");
  }

  const threshold = await findThresholdForAmount(invoice.amount);
  if (!threshold || threshold.levels.length === 0) {
    throw new ApprovalError(
      "No approval rule matches this invoice amount. Ask an admin to configure one."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PENDING, thresholdId: threshold.id },
    });

    await tx.invoiceApproval.createMany({
      data: threshold.levels.map((level) => ({
        invoiceId,
        order: level.order,
        role: level.role,
        status:
          level.order === threshold.levels[0].order
            ? ApprovalStepStatus.PENDING
            : ApprovalStepStatus.WAITING,
      })),
    });

    await tx.activityLog.create({
      data: {
        invoiceId,
        userId: invoice.submittedById,
        action: "SUBMITTED",
        meta: `Routed via "${threshold.name}" (${threshold.levels.length} approval step(s))`,
      },
    });
  });

  const firstLevel = threshold.levels[0];
  await notifyRoleApprovers(invoiceId, firstLevel.role, "APPROVAL_REQUESTED");
}

async function notifyRoleApprovers(
  invoiceId: string,
  role: Role,
  type: NotificationType
) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const approvers = await prisma.user.findMany({
    where: { role, active: true },
  });

  await Promise.all(
    approvers.map((approver) =>
      sendNotification({
        userId: approver.id,
        type,
        message: `Invoice ${invoice.invoiceNumber} from ${invoice.vendorName} (${invoice.amount} ${invoice.currency}) needs your approval.`,
        link: `/invoices/${invoiceId}`,
      })
    )
  );
}

export async function actOnApprovalStep({
  invoiceId,
  actorId,
  actorRole,
  decision,
  comment,
}: {
  invoiceId: string;
  actorId: string;
  actorRole: Role;
  decision: "APPROVE" | "REJECT";
  comment?: string;
}) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { approvals: { orderBy: { order: "asc" } } },
  });

  if (invoice.status !== InvoiceStatus.PENDING) {
    throw new ApprovalError("This invoice is not awaiting approval.");
  }

  const currentStep = invoice.approvals.find(
    (a) => a.status === ApprovalStepStatus.PENDING
  );
  if (!currentStep) {
    throw new ApprovalError("No pending approval step found.");
  }

  const canAct = actorRole === currentStep.role || actorRole === Role.ADMIN;
  if (!canAct) {
    throw new ApprovalError(
      `This step requires a ${currentStep.role} approver.`
    );
  }

  const nextStep = invoice.approvals.find((a) => a.order === currentStep.order + 1);

  await prisma.$transaction(async (tx) => {
    await tx.invoiceApproval.update({
      where: { id: currentStep.id },
      data: {
        status:
          decision === "APPROVE"
            ? ApprovalStepStatus.APPROVED
            : ApprovalStepStatus.REJECTED,
        approverId: actorId,
        comment,
        actedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        invoiceId,
        userId: actorId,
        action: decision === "APPROVE" ? "STEP_APPROVED" : "STEP_REJECTED",
        meta: comment ?? undefined,
      },
    });

    if (decision === "REJECT") {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.REJECTED },
      });
      await tx.invoiceApproval.updateMany({
        where: {
          invoiceId,
          status: ApprovalStepStatus.WAITING,
        },
        data: { status: ApprovalStepStatus.SKIPPED },
      });
      await tx.activityLog.create({
        data: { invoiceId, userId: actorId, action: "REJECTED" },
      });
    } else if (nextStep) {
      await tx.invoiceApproval.update({
        where: { id: nextStep.id },
        data: { status: ApprovalStepStatus.PENDING },
      });
    } else {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.APPROVED },
      });
      await tx.activityLog.create({
        data: { invoiceId, userId: actorId, action: "APPROVED" },
      });
    }
  });

  if (decision === "REJECT") {
    await sendNotification({
      userId: invoice.submittedById,
      type: NotificationType.INVOICE_REJECTED,
      message: `Invoice ${invoice.invoiceNumber} was rejected.`,
      link: `/invoices/${invoiceId}`,
    });
  } else if (nextStep) {
    await notifyRoleApprovers(invoiceId, nextStep.role, NotificationType.APPROVAL_REQUESTED);
  } else {
    await sendNotification({
      userId: invoice.submittedById,
      type: NotificationType.INVOICE_APPROVED,
      message: `Invoice ${invoice.invoiceNumber} was fully approved.`,
      link: `/invoices/${invoiceId}`,
    });
  }
}
