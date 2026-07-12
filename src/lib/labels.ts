import type { PaymentMethod, SessionStatus } from "@prisma/client";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  SCHEDULED: "Naplánovaný",
  COMPLETED: "Odtrénovaný",
  CANCELLED: "Zrušený",
  NO_SHOW: "Neprišiel/-la",
};

export const SESSION_STATUS_STYLES: Record<SessionStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  NO_SHOW: "bg-amber-50 text-amber-700",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Hotovosť",
  TRANSFER: "Prevod",
  CARD: "Karta",
  OTHER: "Iné",
};
