"use client";

import { useActionState, useState } from "react";
import { createPayment } from "@/lib/actions/payments";

export function NewPaymentForm({
  clientId,
  packages,
}: {
  clientId: string;
  packages: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createPayment, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        + Zaznamenať platbu
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-md border border-slate-200 p-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">Suma (EUR)</label>
          <input name="amount" type="number" min={0} step="0.01" required className="input mt-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Spôsob</label>
          <select name="method" className="input mt-1">
            <option value="CASH">Hotovosť</option>
            <option value="TRANSFER">Prevod</option>
            <option value="CARD">Karta</option>
            <option value="OTHER">Iné</option>
          </select>
        </div>
      </div>
      {packages.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Priradiť k balíčku (nepovinné)
          </label>
          <select name="packageId" className="input mt-1">
            <option value="">— žiadny —</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Poznámka (nepovinné)
        </label>
        <input name="note" className="input mt-1" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ukladám..." : "Uložiť platbu"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Zrušiť
        </button>
      </div>
    </form>
  );
}
