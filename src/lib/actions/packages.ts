"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";

const createPackageSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Názov je povinný"),
  totalCredits: z.coerce.number().int().min(1, "Aspoň 1 tréning"),
  price: z.coerce.number().min(0, "Cena musí byť kladné číslo"),
  logPayment: z.coerce.boolean().optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).optional(),
});

export async function createPackage(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireTrainer();

  const parsed = createPackageSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    totalCredits: formData.get("totalCredits"),
    price: formData.get("price"),
    logPayment: formData.get("logPayment") === "on",
    paymentMethod: formData.get("paymentMethod") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  const { clientId, name, totalCredits, price, logPayment, paymentMethod } =
    parsed.data;

  const client = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
  });
  if (!client) {
    return { error: "Klient nebol nájdený" };
  }

  await prisma.$transaction(async (tx) => {
    const pkg = await tx.trainingPackage.create({
      data: {
        clientId,
        name,
        totalCredits,
        remainingCredits: totalCredits,
        price,
      },
    });

    if (logPayment) {
      await tx.payment.create({
        data: {
          clientId,
          packageId: pkg.id,
          amount: price,
          method: paymentMethod ?? "CASH",
        },
      });
    }
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/payments");
  return {};
}
