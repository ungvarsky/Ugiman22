"use client";

import { useActionState } from "react";
import { createApprovalThreshold, type ActionState } from "@/lib/actions/admin";

const LEVEL_ROLES = ["MANAGER", "FINANCE", "DIRECTOR"] as const;

export function NewThresholdForm() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    createApprovalThreshold,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-3 gap-3">
        <input name="name" placeholder="Rule name" required className="input" />
        <input name="minAmount" type="number" step="0.01" min="0" placeholder="Min amount" required className="input" />
        <input name="maxAmount" type="number" step="0.01" min="0" placeholder="Max amount (blank = no limit)" className="input" />
      </div>
      <select name="currency" defaultValue="EUR" className="input w-32">
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="CZK">CZK</option>
      </select>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">
          Approval levels, in order (check all that apply):
        </p>
        <div className="flex gap-4">
          {LEVEL_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" name="roles" value={role} />
              {role}
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create rule"}
      </button>
    </form>
  );
}
