"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}
