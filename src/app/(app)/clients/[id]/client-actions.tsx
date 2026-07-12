"use client";

import { useTransition } from "react";
import { setClientActive } from "@/lib/actions/clients";

export function ToggleActiveButton({
  clientId,
  active,
}: {
  clientId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => setClientActive(clientId, !active))}
      disabled={pending}
      className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
    >
      {active ? "Deaktivovať klienta" : "Aktivovať klienta"}
    </button>
  );
}
