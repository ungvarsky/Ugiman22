"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  role: z.nativeEnum(Role),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ActionState = { error?: string };

export async function createUserAction(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function setUserActive(userId: string, active: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: Role) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

const thresholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  minAmount: z.coerce.number().min(0),
  maxAmount: z.string().optional(),
  currency: z.string().trim().min(1).default("EUR"),
  roles: z.array(z.nativeEnum(Role)).min(1, "At least one approval level is required"),
});

export async function createApprovalThreshold(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const roles = formData.getAll("roles").map(String);
  const maxAmountRaw = String(formData.get("maxAmount") ?? "").trim();

  const parsed = thresholdSchema.safeParse({
    name: formData.get("name"),
    minAmount: formData.get("minAmount"),
    maxAmount: maxAmountRaw || undefined,
    currency: formData.get("currency") || "EUR",
    roles,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.approvalThreshold.create({
    data: {
      name: parsed.data.name,
      minAmount: parsed.data.minAmount,
      maxAmount: parsed.data.maxAmount ? Number(parsed.data.maxAmount) : null,
      currency: parsed.data.currency,
      levels: {
        create: parsed.data.roles.map((role, i) => ({ order: i + 1, role })),
      },
    },
  });

  revalidatePath("/admin/approval-rules");
  return {};
}

export async function deleteApprovalThreshold(id: string): Promise<ActionState> {
  await requireAdmin();
  const inUse = await prisma.invoice.count({ where: { thresholdId: id } });
  if (inUse > 0) {
    return { error: "Cannot delete a rule that has invoices routed through it." };
  }
  await prisma.approvalThreshold.delete({ where: { id } });
  revalidatePath("/admin/approval-rules");
  return {};
}
