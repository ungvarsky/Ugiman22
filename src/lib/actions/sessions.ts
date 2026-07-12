"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import type { SessionStatus } from "@prisma/client";

const createSessionSchema = z.object({
  clientId: z.string().min(1, "Vyberte klienta"),
  packageId: z.string().optional(),
  title: z.string().trim().optional(),
  date: z.string().min(1, "Vyberte dátum"),
  startTime: z.string().min(1, "Vyberte čas začiatku"),
  endTime: z.string().min(1, "Vyberte čas konca"),
});

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function createSession(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireTrainer();

  const parsed = createSessionSchema.safeParse({
    clientId: formData.get("clientId"),
    packageId: formData.get("packageId") || undefined,
    title: formData.get("title") || undefined,
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  const { clientId, packageId, title, date, startTime, endTime } = parsed.data;
  const start = combineDateTime(date, startTime);
  const end = combineDateTime(date, endTime);
  if (end <= start) {
    return { error: "Čas konca musí byť po čase začiatku" };
  }

  await prisma.trainingSession.create({
    data: {
      clientId,
      packageId: packageId || null,
      title: title || null,
      startTime: start,
      endTime: end,
    },
  });

  revalidatePath("/calendar");
  return {};
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
) {
  await requireTrainer();

  await prisma.$transaction(async (tx) => {
    const session = await tx.trainingSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    if (session.status === status) return;

    if (session.packageId) {
      const wasCompleted = session.status === "COMPLETED";
      const willBeCompleted = status === "COMPLETED";
      if (!wasCompleted && willBeCompleted) {
        await tx.trainingPackage.update({
          where: { id: session.packageId },
          data: { remainingCredits: { decrement: 1 } },
        });
      } else if (wasCompleted && !willBeCompleted) {
        await tx.trainingPackage.update({
          where: { id: session.packageId },
          data: { remainingCredits: { increment: 1 } },
        });
      }
    }

    await tx.trainingSession.update({
      where: { id: sessionId },
      data: { status },
    });
  });

  revalidatePath("/calendar");
}

export async function deleteSession(sessionId: string) {
  await requireTrainer();

  await prisma.$transaction(async (tx) => {
    const session = await tx.trainingSession.findUniqueOrThrow({
      where: { id: sessionId },
    });

    if (session.packageId && session.status === "COMPLETED") {
      await tx.trainingPackage.update({
        where: { id: session.packageId },
        data: { remainingCredits: { increment: 1 } },
      });
    }

    await tx.trainingSession.delete({ where: { id: sessionId } });
  });

  revalidatePath("/calendar");
}
