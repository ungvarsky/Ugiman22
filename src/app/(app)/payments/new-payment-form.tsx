"use client";

import { useActionState, useMemo, useState } from "react";
import { createPayment } from "@/lib/actions/payments";

type ClientOption = { id: string; name: string };
type PackageOption = { id: string; name: string; clientId: string };

export function NewPaymentForm({
  clients,
  packages,
}: {
  clients: ClientOption[];
  packages: PackageOption[];
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [state, formAction, pending] = useActionState(createPayment, undefined);

  const clientPackages = useMemo(
    () => packages.filter((p) => p.clientId === clientId),
    [packages, clientId]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
      >
        + Zaznamenať platbu
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Nová platba</h2>
      <div>
        <label className="block text-xs font-medium text-slate-700">Klient</label>
        <select
          name="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="input mt-1"
        >
          <option value="">— vyberte klienta —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
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
      {clientId && clientPackages.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Priradiť k balíčku (nepovinné)
          </label>
          <select name="packageId" className="input mt-1">
            <option value="">— žiadny —</option>
            {clientPackages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Dátum platby
        </label>
        <input
          name="paidAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="input mt-1"
        />
      </div>
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
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ukladám..." : "Uložiť platbu"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Zrušiť
        </button>
      </div>
    </form>
  );
}
