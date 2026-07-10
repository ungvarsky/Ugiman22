import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { UserRow } from "./user-row";
import { NewUserForm } from "./new-user-form";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Users</h1>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={{ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Add user</h2>
        <NewUserForm />
      </div>
    </div>
  );
}
