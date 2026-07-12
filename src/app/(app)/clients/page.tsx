import Link from "next/link";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewClientForm } from "./new-client-form";

export default async function ClientsPage() {
  await requireTrainer();

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      packages: { select: { remainingCredits: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Klienti</h1>
      </div>

      <NewClientForm />

      <ul className="space-y-2">
        {clients.map((client) => {
          const credits = client.packages.reduce(
            (sum, p) => sum + p.remainingCredits,
            0
          );
          return (
            <li key={client.id}>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {client.name}
                    {!client.active && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Neaktívny
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{client.email}</p>
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {credits} kreditov
                </span>
              </Link>
            </li>
          );
        })}
        {clients.length === 0 && (
          <p className="text-sm text-slate-500">Zatiaľ nemáte pridaných klientov.</p>
        )}
      </ul>
    </div>
  );
}
