import { Role } from "@prisma/client";
import { Calendar, CalendarClock, Play, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { generateMaintenanceAction, toggleMaintenancePlanAction } from "@/app/actions";

type MaintenancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;

  const plans = await prisma.maintenancePlan.findMany({
    where: { ...(user.establishmentId ? { equipment: { establishmentId: user.establishmentId } } : {}) },
    include: { equipment: { include: { location: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  const dueCount = plans.filter((p) => p.active && new Date(p.nextDueDate) <= new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance preventive"
        description="Planifiez des interventions recurrentes et generez automatiquement les demandes."
        actions={
          <div className="flex gap-2">
            {dueCount > 0 ? (
              <form action={generateMaintenanceAction}>
                <button type="submit" className="secondary-button gap-2">
                  <Play className="h-4 w-4" />
                  Generer {dueCount} intervention(s)
                </button>
              </form>
            ) : null}
            <Link href="/maintenance/planning" className="secondary-button gap-2">
              <Calendar className="h-4 w-4" />
              Planning annuel
            </Link>
            <Link href="/maintenance/new" className="primary-button gap-2">
              <Plus className="h-4 w-4" />
              Nouveau plan
            </Link>
          </div>
        }
      />

      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="space-y-3">
        {plans.map((plan) => {
          const isOverdue = plan.active && new Date(plan.nextDueDate) <= new Date();
          return (
            <div key={plan.id} className={`panel p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${!plan.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${isOverdue ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}>
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{plan.title}</p>
                  <p className="text-sm text-gray-500">{plan.equipment.name}</p>
                  {plan.description ? <p className="text-sm text-gray-400 mt-1">{plan.description}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-400">Tous les </span>
                  <span className="font-semibold text-gray-700">{plan.intervalDays} jours</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Prochaine : </span>
                  <span className={`font-semibold ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                    {formatDate(plan.nextDueDate)}
                    {isOverdue ? " (en retard)" : ""}
                  </span>
                </div>
                {plan.lastGenerated ? (
                  <div className="text-xs text-gray-400">
                    Derniere gen. : {formatDate(plan.lastGenerated)}
                  </div>
                ) : null}
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${plan.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}>
                  {plan.active ? "Actif" : "Inactif"}
                </span>
                <form action={toggleMaintenancePlanAction}>
                  <input type="hidden" name="id" value={plan.id} />
                  <button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${plan.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                    {plan.active ? "Desactiver" : "Activer"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {plans.length === 0 ? (
          <div className="panel p-10 text-center">
            <CalendarClock className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Aucun plan de maintenance</h2>
            <p className="mt-2 text-sm text-gray-500">Creez votre premier plan pour automatiser les interventions recurrentes.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
