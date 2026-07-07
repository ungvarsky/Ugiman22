"use client";

import { useActionState } from "react";
import { createUserAction, type ActionState } from "@/lib/actions/admin";
import { Role } from "@prisma/client";

const ROLES: Role[] = [Role.EMPLOYEE, Role.MANAGER, Role.FINANCE, Role.DIRECTOR, Role.ADMIN];

export function NewUserForm() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    createUserAction,
    undefined
  );

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <input name="name" placeholder="Full name" required className="input" />
      <input name="email" type="email" placeholder="Email" required className="input" />
      <select name="role" defaultValue="EMPLOYEE" className="input">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input name="password" type="password" placeholder="Temporary password" required className="input" />
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
