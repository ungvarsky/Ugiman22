"use client";

import { useActionState, useMemo, useState } from "react";
import { createSession } from "@/lib/actions/sessions";

type ClientOption = { id: string; name: string };
type PackageOption = {
  id: string;
  name: string;
  clientId: string;
  remainingCredits: number;
};

export function SessionForm({
  clients,
  packages,
  defaultDate,
}: {
  clients: ClientOption[];
  packages: PackageOption[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [state, formAction, pending] = useActionState(createSession, undefined);

  const clientPackages = useMemo(
    () => packages.filter((p) => p.clientId === clientId && p.remainingCredits > 0),
    [packages, clientId]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
      >
        + Nový tréning
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Naplánovať tréning</h2>
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
      {clientId && (
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Balíček (nepovinné)
          </label>
          <select name="packageId" className="input mt-1">
            <option value="">— bez balíčka —</option>
            {clientPackages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.remainingCredits} zostáva)
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">Dátum</label>
          <input
            name="date"
            type="date"
            defaultValue={defaultDate}
            required
            className="input mt-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Od</label>
          <input name="startTime" type="time" required className="input mt-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Do</label>
          <input name="endTime" type="time" required className="input mt-1" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Poznámka (nepovinné)
        </label>
        <input name="title" className="input mt-1" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ukladám..." : "Naplánovať"}
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
