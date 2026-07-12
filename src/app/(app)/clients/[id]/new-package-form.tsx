"use client";

import { useActionState, useState } from "react";
import { createPackage } from "@/lib/actions/packages";

export function NewPackageForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [logPayment, setLogPayment] = useState(true);
  const [state, formAction, pending] = useActionState(createPackage, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        + Pridať balíček
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-md border border-slate-200 p-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div>
        <label className="block text-xs font-medium text-slate-700">Názov balíčka</label>
        <input
          name="name"
          required
          placeholder="napr. 10 tréningov"
          className="input mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Počet tréningov
          </label>
          <input
            name="totalCredits"
            type="number"
            min={1}
            required
            className="input mt-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Cena (EUR)</label>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            className="input mt-1"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          name="logPayment"
          checked={logPayment}
          onChange={(e) => setLogPayment(e.target.checked)}
        />
        Rovno zaznamenať platbu za balíček
      </label>
      {logPayment && (
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Spôsob platby
          </label>
          <select name="paymentMethod" className="input mt-1">
            <option value="CASH">Hotovosť</option>
            <option value="TRANSFER">Prevod</option>
            <option value="CARD">Karta</option>
            <option value="OTHER">Iné</option>
          </select>
        </div>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ukladám..." : "Vytvoriť balíček"}
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
