"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";

const createPaymentSchema = z.object({
  clientId: z.string().min(1, "Vyberte klienta"),
  packageId: z.string().optional(),
  amount: z.coerce.number().positive("Suma musí byť kladná"),
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
  note: z.string().trim().optional(),
  paidAt: z.string().optional(),
});

export async function createPayment(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireTrainer();

  const parsed = createPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
    packageId: formData.get("packageId") || undefined,
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note") || undefined,
    paidAt: formData.get("paidAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  const { clientId, packageId, amount, method, note, paidAt } = parsed.data;

  await prisma.payment.create({
    data: {
      clientId,
      packageId: packageId || null,
      amount,
      method,
      note,
      paidAt: paidAt ? new Date(paidAt) : undefined,
    },
  });

  revalidatePath("/payments");
  revalidatePath(`/clients/${clientId}`);
  return {};
}
