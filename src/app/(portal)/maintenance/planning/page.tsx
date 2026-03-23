import { Role } from "@prisma/client";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const SHORT_MONTHS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

type PlannedRow = {
  date: Date;
  planTitle: string;
  planId: string;
  equipmentName: string;
  locationLabel: string;
  intervalDays: number;
  // Linked request (if generated)
  requestId?: string;
  requestNumber?: string;
  requestStatus?: string;
  assignedTo?: string;
};

function computeInterventions(
  plans: {
    id: string;
    title: string;
    nextDueDate: Date;
    intervalDays: number;
    active: boolean;
    equipment: { name: string; location: { building: string; floor: string | null; room: string | null } | null };
  }[],
  year: number,
): PlannedRow[] {
  const rows: PlannedRow[] = [];
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  for (const plan of plans) {
    if (!plan.active) continue;
    const loc = plan.equipment.location;
    const locationLabel = loc ? [loc.building, loc.floor, loc.room].filter(Boolean).join(" - ") : "";
    const intervalMs = plan.intervalDays * 86400000;

    let cursor = new Date(plan.nextDueDate);
    while (cursor < yearStart) cursor = new Date(cursor.getTime() + intervalMs);
    while (cursor <= yearEnd) {
      rows.push({
        date: new Date(cursor),
        planTitle: plan.title,
        planId: plan.id,
        equipmentName: plan.equipment.name,
        locationLabel,
        intervalDays: plan.intervalDays,
      });
      cursor = new Date(cursor.getTime() + intervalMs);
    }
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

export default async function PlanningPage({ searchParams }: Props) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;

  const currentYear = new Date().getFullYear();
  const rawYear = typeof params.year === "string" ? parseInt(params.year, 10) : NaN;
  const year = !isNaN(rawYear) && rawYear >= 2020 && rawYear <= 2040 ? rawYear : currentYear;
  const monthFilter = typeof params.month === "string" ? parseInt(params.month, 10) : -1;

  const estFilter = user.establishmentId ? { equipment: { establishmentId: user.establishmentId } } : {};

  const [plans, generatedRequests] = await Promise.all([
    prisma.maintenancePlan.findMany({
      where: { active: true, ...estFilter },
      include: { equipment: { include: { location: true } } },
      orderBy: { nextDueDate: "asc" },
    }),
    // Requests linked to maintenance (have "[Maintenance preventive]" in description)
    prisma.request.findMany({
      where: {
        description: { contains: "[Maintenance preventive]" },
        createdAt: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) },
        ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}),
      },
      include: { assignedTo: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  let rows = computeInterventions(plans, year);

  // Match generated requests to planned interventions
  for (const row of rows) {
    const match = generatedRequests.find((r) => {
      const desc = r.description.toLowerCase();
      const title = row.planTitle.toLowerCase();
      if (!desc.includes(title)) return false;
      // Match by month (requests can be generated a few days off)
      const rMonth = new Date(r.createdAt).getMonth();
      const pMonth = row.date.getMonth();
      return Math.abs(rMonth - pMonth) <= 1 || (rMonth === 0 && pMonth === 11) || (rMonth === 11 && pMonth === 0);
    });
    if (match) {
      row.requestId = match.id;
      row.requestNumber = match.number;
      row.requestStatus = match.status;
      row.assignedTo = match.assignedTo ? `${match.assignedTo.firstName} ${match.assignedTo.lastName[0]}.` : undefined;
    }
  }

  // Apply month filter
  if (monthFilter >= 0 && monthFilter <= 11) {
    rows = rows.filter((r) => r.date.getMonth() === monthFilter);
  }

  const today = new Date();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Planning annuel"
        description="Toutes les interventions preventives prevues, connectees au planning hebdomadaire."
        actions={
          <Link href="/maintenance" className="secondary-button">
            Retour aux plans
          </Link>
        }
      />

      {/* Year navigation + month filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/maintenance/planning?year=${year - 1}`} className="secondary-button p-1.5">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-xl font-bold text-gray-900 min-w-[60px] text-center">{year}</h2>
          <Link href={`/maintenance/planning?year=${year + 1}`} className="secondary-button p-1.5">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Link
            href={`/maintenance/planning?year=${year}`}
            className={`rounded px-2 py-1 text-[11px] font-semibold transition ${monthFilter === -1 ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Tous
          </Link>
          {SHORT_MONTHS.map((m, i) => (
            <Link
              key={i}
              href={`/maintenance/planning?year=${year}&month=${i}`}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${monthFilter === i ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {m}
            </Link>
          ))}
        </div>

        <p className="text-xs text-gray-400">{rows.length} intervention{rows.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <section className="panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Intervention</th>
              <th className="px-3 py-2">Equipement</th>
              <th className="px-3 py-2 hidden lg:table-cell">Localisation</th>
              <th className="px-3 py-2">Frequence</th>
              <th className="px-3 py-2">Technicien</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {rows.map((row, idx) => {
              const isPast = row.date < today;
              const isThisMonth = row.date.getMonth() === today.getMonth() && row.date.getFullYear() === today.getFullYear();
              return (
                <tr key={`${row.planId}-${idx}`} className={`group transition ${isThisMonth ? "bg-indigo-50/30" : ""} ${isPast && !row.requestStatus ? "opacity-50" : ""} hover:bg-indigo-50/20`}>
                  <td className="px-3 py-1.5 whitespace-nowrap font-medium text-gray-700">
                    {row.date.getDate().toString().padStart(2, "0")} {SHORT_MONTHS[row.date.getMonth()]}
                  </td>
                  <td className="px-3 py-1.5 font-semibold text-gray-900">{row.planTitle}</td>
                  <td className="px-3 py-1.5 text-gray-600">{row.equipmentName}</td>
                  <td className="px-3 py-1.5 text-gray-400 hidden lg:table-cell">{row.locationLabel || "—"}</td>
                  <td className="px-3 py-1.5 text-gray-400">{row.intervalDays}j</td>
                  <td className="px-3 py-1.5">
                    {row.assignedTo ? (
                      <span className="text-indigo-600 font-medium">{row.assignedTo}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {row.requestStatus ? (
                      <StatusBadge kind="request" value={row.requestStatus} />
                    ) : isPast ? (
                      <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Non genere</span>
                    ) : (
                      <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">Planifie</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {row.requestId ? (
                      <Link href={`/demandes/${row.requestId}`} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition">
                        Voir
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">Aucune intervention prevue {monthFilter >= 0 ? `en ${MONTH_NAMES[monthFilter].toLowerCase()}` : `pour ${year}`}</p>
            <Link href="/maintenance/new" className="primary-button mt-3 inline-flex text-xs">
              Creer un plan
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
