import { Role } from "@prisma/client";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/utils";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

type PlannedIntervention = {
  date: Date;
  planTitle: string;
  equipmentName: string;
  locationLabel: string;
  intervalDays: number;
  planId: string;
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
): Map<number, PlannedIntervention[]> {
  const map = new Map<number, PlannedIntervention[]>();
  for (let m = 0; m < 12; m++) map.set(m, []);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  for (const plan of plans) {
    if (!plan.active) continue;

    const loc = plan.equipment.location;
    const locationLabel = loc
      ? [loc.building, loc.floor, loc.room].filter(Boolean).join(" - ")
      : "";

    const next = new Date(plan.nextDueDate);
    const intervalMs = plan.intervalDays * 86400000;

    // Start from nextDueDate and go forward only
    let cursor = new Date(next);

    // If nextDueDate is before the year, advance to the first occurrence in the year
    while (cursor < yearStart) {
      cursor = new Date(cursor.getTime() + intervalMs);
    }

    // Go forward through the year
    while (cursor <= yearEnd) {
      const month = cursor.getMonth();
      map.get(month)!.push({
        date: new Date(cursor),
        planTitle: plan.title,
        equipmentName: plan.equipment.name,
        locationLabel,
        intervalDays: plan.intervalDays,
        planId: plan.id,
      });
      cursor = new Date(cursor.getTime() + intervalMs);
    }
  }

  // Sort each month by date
  for (const [, interventions] of map) {
    interventions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return map;
}

export default async function PlanningPage({ searchParams }: Props) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;

  const currentYear = new Date().getFullYear();
  const rawYear = typeof params.year === "string" ? parseInt(params.year, 10) : NaN;
  const year = !isNaN(rawYear) && rawYear >= 2020 && rawYear <= 2040 ? rawYear : currentYear;

  const plans = await prisma.maintenancePlan.findMany({
    where: { active: true, ...(user.establishmentId ? { equipment: { establishmentId: user.establishmentId } } : {}) },
    include: { equipment: { include: { location: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  const interventionsByMonth = computeInterventions(plans, year);

  const today = new Date();
  const currentMonth = today.getFullYear() === year ? today.getMonth() : -1;

  let totalInterventions = 0;
  for (const [, list] of interventionsByMonth) totalInterventions += list.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning annuel"
        description="Vue d'ensemble des interventions preventives prevues sur l'annee."
        actions={
          <Link href="/maintenance" className="secondary-button">
            Retour aux plans
          </Link>
        }
      />

      {/* Year navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/maintenance/planning?year=${year - 1}`}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{year}</h2>
          <Link
            href={`/maintenance/planning?year=${year + 1}`}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          {totalInterventions} intervention{totalInterventions !== 1 ? "s" : ""} prevue{totalInterventions !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Month grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTH_NAMES.map((monthName, monthIndex) => {
          const interventions = interventionsByMonth.get(monthIndex) ?? [];
          const isCurrentMonth = monthIndex === currentMonth;
          const isPast = year < currentYear || (year === currentYear && monthIndex < currentMonth);

          return (
            <div
              key={monthIndex}
              className={`panel overflow-hidden ${isCurrentMonth ? "ring-2 ring-indigo-400" : ""} ${isPast ? "opacity-70" : ""}`}
            >
              {/* Month header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isCurrentMonth ? "bg-indigo-50" : "bg-gray-50"}`}>
                <h3 className={`text-sm font-bold ${isCurrentMonth ? "text-indigo-700" : "text-gray-700"}`}>
                  {monthName}
                </h3>
                {interventions.length > 0 ? (
                  <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold text-white ${isCurrentMonth ? "bg-indigo-500" : "bg-gray-400"}`}>
                    {interventions.length}
                  </span>
                ) : null}
              </div>

              {/* Interventions list */}
              <div className="px-4 py-3 space-y-2 min-h-[80px]">
                {interventions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Aucune intervention</p>
                ) : (
                  interventions.map((intervention, idx) => {
                    const interventionDate = new Date(intervention.date);
                    const isPastDate = interventionDate < today;
                    const day = interventionDate.getDate();
                    const dayStr = day.toString().padStart(2, "0");

                    return (
                      <div
                        key={`${intervention.planId}-${idx}`}
                        className={`flex items-start gap-3 rounded-lg border p-2.5 text-sm ${isPastDate ? "border-gray-100 bg-gray-50/50" : "border-indigo-100 bg-indigo-50/30"}`}
                      >
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isPastDate ? "bg-gray-200 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                          {dayStr}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold truncate ${isPastDate ? "text-gray-500" : "text-gray-900"}`}>
                            {intervention.planTitle}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{intervention.equipmentName}</p>
                          {intervention.locationLabel ? (
                            <p className="text-xs text-gray-400 truncate">{intervention.locationLabel}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 ? (
        <div className="panel p-10 text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Aucun plan actif</h2>
          <p className="mt-2 text-sm text-gray-500">
            Creez des plans de maintenance preventive pour voir les interventions sur le planning.
          </p>
          <Link href="/maintenance/new" className="primary-button mt-4 inline-flex">
            Creer un plan
          </Link>
        </div>
      ) : null}
    </div>
  );
}
