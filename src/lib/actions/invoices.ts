"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { submitInvoiceForApproval, actOnApprovalStep, ApprovalError } from "@/lib/approval";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const invoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  vendorName: z.string().trim().min(1, "Vendor name is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(1).default("EUR"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  description: z.string().trim().optional(),
});

export type InvoiceFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function saveUploadedFile(file: File): Promise<{ fileUrl: string; fileName: string } | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 10MB.");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, safeName), buffer);

  return { fileUrl: `/uploads/${safeName}`, fileName: file.name };
}

export async function createInvoice(
  _prevState: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await requireSession();

  const raw = {
    invoiceNumber: formData.get("invoiceNumber"),
    vendorName: formData.get("vendorName"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "EUR",
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate") || undefined,
    description: formData.get("description") || undefined,
  };

  const parsed = invoiceSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  let uploaded: { fileUrl: string; fileName: string } | null = null;
  const file = formData.get("attachment");
  try {
    if (file instanceof File) {
      uploaded = await saveUploadedFile(file);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "File upload failed." };
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: parsed.data.invoiceNumber,
      vendorName: parsed.data.vendorName,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      description: parsed.data.description,
      fileUrl: uploaded?.fileUrl,
      fileName: uploaded?.fileName,
      submittedById: session.user.id,
      status: "DRAFT",
    },
  });

  try {
    await submitInvoiceForApproval(invoice.id);
  } catch (err) {
    if (err instanceof ApprovalError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  redirect(`/invoices/${invoice.id}`);
}

export async function approveInvoiceStep(invoiceId: string, comment: string) {
  const session = await requireSession();
  try {
    await actOnApprovalStep({
      invoiceId,
      actorId: session.user.id,
      actorRole: session.user.role,
      decision: "APPROVE",
      comment: comment || undefined,
    });
  } catch (err) {
    if (err instanceof ApprovalError) {
      return { error: err.message };
    }
    throw err;
  }
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  return {};
}

export async function rejectInvoiceStep(invoiceId: string, comment: string) {
  const session = await requireSession();
  if (!comment || !comment.trim()) {
    return { error: "A comment is required when rejecting an invoice." };
  }
  try {
    await actOnApprovalStep({
      invoiceId,
      actorId: session.user.id,
      actorRole: session.user.role,
      decision: "REJECT",
      comment,
    });
  } catch (err) {
    if (err instanceof ApprovalError) {
      return { error: err.message };
    }
    throw err;
  }
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  return {};
}
