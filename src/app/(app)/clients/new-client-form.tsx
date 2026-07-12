"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/actions/clients";

export function NewClientForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClient, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
      >
        + Pridať klienta
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Nový klient</h2>
      <div>
        <label className="block text-xs font-medium text-slate-700">Meno</label>
        <input name="name" required className="input mt-1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="input mt-1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Telefón (nepovinné)
        </label>
        <input name="phone" className="input mt-1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Prvotné heslo pre klienta
        </label>
        <input name="password" type="text" required minLength={6} className="input mt-1" />
        <p className="mt-1 text-xs text-slate-400">
          Toto heslo odovzdajte klientovi, aby sa mohol prihlásiť.
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ukladám..." : "Vytvoriť klienta"}
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
