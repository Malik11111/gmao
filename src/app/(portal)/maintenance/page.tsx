import { Role } from "@prisma/client";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
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
    include: { equipment: true },
    orderBy: { nextDueDate: "asc" },
  });

  const dueCount = plans.filter((p) => p.active && new Date(p.nextDueDate) <= new Date()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Maintenance preventive <span className="text-sm font-normal text-gray-400 ml-1">({plans.length})</span></h1>
        <div className="flex gap-2">
          {dueCount > 0 ? (
            <form action={generateMaintenanceAction}>
              <button type="submit" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
                Generer {dueCount} intervention(s)
              </button>
            </form>
          ) : null}
          <Link href="/maintenance/planning" className="secondary-button gap-2 text-xs py-2 px-3">
            <Calendar className="h-3.5 w-3.5" />
            Planning annuel
          </Link>
          <Link href="/maintenance/new" className="primary-button gap-2 text-xs py-2 px-3">
            <Plus className="h-3.5 w-3.5" />
            Nouveau plan
          </Link>
        </div>
      </div>

      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">{success}</div> : null}

      <section className="panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Equipement</th>
              <th className="px-3 py-2">Frequence</th>
              <th className="px-3 py-2">Prochaine</th>
              <th className="px-3 py-2 hidden lg:table-cell">Derniere gen.</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {plans.map((plan) => {
              const isOverdue = plan.active && new Date(plan.nextDueDate) <= new Date();
              return (
                <tr key={plan.id} className={`group hover:bg-indigo-50/30 transition ${!plan.active ? "opacity-50" : ""}`}>
                  <td className="px-3 py-1.5">
                    <p className="font-semibold text-gray-900">{plan.title}</p>
                    {plan.description ? <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{plan.description}</p> : null}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">{plan.equipment.name}</td>
                  <td className="px-3 py-1.5 text-gray-500">{plan.intervalDays}j</td>
                  <td className="px-3 py-1.5">
                    <span className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                      {formatDate(plan.nextDueDate)}
                      {isOverdue ? " !" : ""}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-400 hidden lg:table-cell">
                    {plan.lastGenerated ? formatDate(plan.lastGenerated) : "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${plan.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}>
                      {plan.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <form action={toggleMaintenancePlanAction}>
                      <input type="hidden" name="id" value={plan.id} />
                      <button type="submit" className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition ${plan.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        {plan.active ? "Desactiver" : "Activer"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {plans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">Aucun plan de maintenance</p>
            <Link href="/maintenance/new" className="primary-button mt-3 inline-flex text-xs">Creer un plan</Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
