import Link from "next/link";
import {
  addMonths,
  endOfMonth,
  format,
  isToday,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns";
import { sk } from "date-fns/locale";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/format";
import { SESSION_STATUS_LABELS, SESSION_STATUS_STYLES } from "@/lib/labels";
import { SessionForm } from "./session-form";
import { SessionActions } from "./session-actions";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireSession();
  const { month } = await searchParams;

  const monthDate = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const rangeStart = startOfMonth(monthDate);
  const rangeEnd = endOfMonth(monthDate);

  const isTrainer = session.user.role === "TRAINER";

  const sessions = await prisma.trainingSession.findMany({
    where: {
      startTime: { gte: rangeStart, lte: rangeEnd },
      ...(isTrainer ? {} : { clientId: session.user.id }),
    },
    include: { client: true },
    orderBy: { startTime: "asc" },
  });

  const grouped = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = format(s.startTime, "yyyy-MM-dd");
    const list = grouped.get(key) ?? [];
    list.push(s);
    grouped.set(key, list);
  }

  const prevMonth = format(subMonths(rangeStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(rangeStart, 1), "yyyy-MM");

  let clients: { id: string; name: string }[] = [];
  let packages: { id: string; name: string; clientId: string; remainingCredits: number }[] = [];
  if (isTrainer) {
    const [clientRows, packageRows] = await Promise.all([
      prisma.user.findMany({
        where: { role: "CLIENT", active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.trainingPackage.findMany({
        where: { remainingCredits: { gt: 0 } },
        select: { id: true, name: true, clientId: true, remainingCredits: true },
      }),
    ]);
    clients = clientRows;
    packages = packageRows;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Kalendár</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/calendar?month=${prevMonth}`} className="text-slate-500 hover:text-slate-800">
            ←
          </Link>
          <span className="font-medium capitalize text-slate-700">
            {format(rangeStart, "LLLL yyyy", { locale: sk })}
          </span>
          <Link href={`/calendar?month=${nextMonth}`} className="text-slate-500 hover:text-slate-800">
            →
          </Link>
        </div>
      </div>

      {isTrainer && (
        <SessionForm
          clients={clients}
          packages={packages}
          defaultDate={format(new Date(), "yyyy-MM-dd")}
        />
      )}

      {grouped.size === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Žiadne tréningy tento mesiac.
        </p>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([day, daySessions]) => {
            const dayDate = daySessions[0].startTime;
            return (
              <section key={day} className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-xs font-semibold uppercase text-slate-500">
                  {format(dayDate, "EEEE d. M.", { locale: sk })}
                  {isToday(dayDate) && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                      Dnes
                    </span>
                  )}
                </h2>
                <ul className="mt-2 divide-y divide-slate-100">
                  {daySessions.map((s) => (
                    <li key={s.id} className="py-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-slate-800">
                            {formatTime(s.startTime)}–{formatTime(s.endTime)}
                            {isTrainer && ` · ${s.client.name}`}
                          </p>
                          {s.title && <p className="text-xs text-slate-500">{s.title}</p>}
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${SESSION_STATUS_STYLES[s.status]}`}
                        >
                          {SESSION_STATUS_LABELS[s.status]}
                        </span>
                      </div>
                      {isTrainer && <SessionActions sessionId={s.id} status={s.status} />}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
