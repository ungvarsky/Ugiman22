import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

export async function sendNotification({
  userId,
  type,
  message,
  link,
}: {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: { userId, type, message, link },
  });

  const mailer = getTransporter();
  if (!mailer) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? "no-reply@hana-trans.sk",
      to: user.email,
      subject: "Hana Trans Invoice Approval",
      text: `${message}${link ? `\n\n${process.env.NEXTAUTH_URL ?? ""}${link}` : ""}`,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}
