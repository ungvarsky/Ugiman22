-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'FINANCE', 'DIRECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStepStatus" AS ENUM ('WAITING', 'PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVOICE_SUBMITTED', 'APPROVAL_REQUESTED', 'INVOICE_APPROVED', 'INVOICE_REJECTED', 'STEP_APPROVED', 'STEP_REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalThreshold" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAmount" DECIMAL(14,2) NOT NULL,
    "maxAmount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLevel" (
    "id" TEXT NOT NULL,
    "thresholdId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "ApprovalLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "description" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedById" TEXT NOT NULL,
    "thresholdId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceApproval" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'WAITING',
    "comment" TEXT,
    "actedAt" TIMESTAMP(3),
    "approverId" TEXT,

    CONSTRAINT "InvoiceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ApprovalThreshold_minAmount_maxAmount_idx" ON "ApprovalThreshold"("minAmount", "maxAmount");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalLevel_thresholdId_order_key" ON "ApprovalLevel"("thresholdId", "order");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_submittedById_idx" ON "Invoice"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceApproval_invoiceId_order_key" ON "InvoiceApproval"("invoiceId", "order");

-- CreateIndex
CREATE INDEX "ActivityLog_invoiceId_idx" ON "ActivityLog"("invoiceId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "ApprovalLevel" ADD CONSTRAINT "ApprovalLevel_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "ApprovalThreshold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "ApprovalThreshold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceApproval" ADD CONSTRAINT "InvoiceApproval_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceApproval" ADD CONSTRAINT "InvoiceApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
