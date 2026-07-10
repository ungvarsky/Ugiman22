"use client";

import { useTransition } from "react";
import { setUserActive, setUserRole } from "@/lib/actions/admin";
import { Role } from "@prisma/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

const ROLES: Role[] = [Role.EMPLOYEE, Role.MANAGER, Role.FINANCE, Role.DIRECTOR, Role.ADMIN];

export function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2">{user.name}</td>
      <td className="px-4 py-2 text-slate-500">{user.email}</td>
      <td className="px-4 py-2">
        <select
          defaultValue={user.role}
          disabled={isPending}
          onChange={(e) => startTransition(() => setUserRole(user.id, e.target.value as Role))}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={user.active}
            disabled={isPending}
            onChange={(e) => startTransition(() => setUserActive(user.id, e.target.checked))}
          />
          <span className="text-xs text-slate-500">{user.active ? "Active" : "Disabled"}</span>
        </label>
      </td>
    </tr>
  );
}
