"use client";

import { useTransition } from "react";
import { deleteSession, updateSessionStatus } from "@/lib/actions/sessions";
import type { SessionStatus } from "@prisma/client";

export function SessionActions({ sessionId, status }: { sessionId: string; status: SessionStatus }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: SessionStatus) {
    startTransition(() => updateSessionStatus(sessionId, next));
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {status !== "COMPLETED" && (
        <button
          disabled={pending}
          onClick={() => setStatus("COMPLETED")}
          className="rounded-full bg-green-50 px-2 py-1 font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
        >
          Odtrénované
        </button>
      )}
      {status !== "NO_SHOW" && (
        <button
          disabled={pending}
          onClick={() => setStatus("NO_SHOW")}
          className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          Neprišiel/-la
        </button>
      )}
      {status !== "SCHEDULED" && (
        <button
          disabled={pending}
          onClick={() => setStatus("SCHEDULED")}
          className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          Naplánovaný
        </button>
      )}
      {status !== "CANCELLED" && (
        <button
          disabled={pending}
          onClick={() => setStatus("CANCELLED")}
          className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
        >
          Zrušiť
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => startTransition(() => deleteSession(sessionId))}
        className="rounded-full px-2 py-1 font-medium text-red-500 hover:bg-red-50 disabled:opacity-60"
      >
        Vymazať
      </button>
    </div>
  );
}
