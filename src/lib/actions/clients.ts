"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Meno je povinné"),
  email: z.string().trim().toLowerCase().email("Neplatný email"),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
});

export async function createClient(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireTrainer();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Tento email už je zaregistrovaný" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const client = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: "CLIENT",
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

const updateClientSchema = z.object({
  name: z.string().trim().min(1, "Meno je povinné"),
  phone: z.string().trim().optional(),
});

export async function updateClient(clientId: string, formData: FormData) {
  await requireTrainer();

  const parsed = updateClientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });

  await prisma.user.update({
    where: { id: clientId, role: "CLIENT" },
    data: { name: parsed.name, phone: parsed.phone },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function setClientActive(clientId: string, active: boolean) {
  await requireTrainer();

  await prisma.user.update({
    where: { id: clientId, role: "CLIENT" },
    data: { active },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}
