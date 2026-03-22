import { Role } from "@prisma/client";
import Link from "next/link";
import { createMaintenancePlanAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

type NewPlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMaintenancePlanPage({ searchParams }: NewPlanPageProps) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  const equipments = await prisma.equipment.findMany({
    where: { status: { not: "RETIRED" }, ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau plan de maintenance"
        description="Definir une intervention preventive recurrente sur un equipement."
        actions={
          <Link href="/maintenance" className="secondary-button">Retour</Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form action={createMaintenancePlanAction} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label" htmlFor="title">Titre du plan</label>
            <input className="field" id="title" name="title" placeholder="Verification annuelle chaudiere" required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="equipmentId">Equipement</label>
            <select className="field" id="equipmentId" name="equipmentId" required>
              <option value="">Selectionner un equipement</option>
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="intervalDays">Intervalle (jours)</label>
            <input className="field" id="intervalDays" name="intervalDays" type="number" min="1" placeholder="90" required />
            <p className="helper">30 = mensuel, 90 = trimestriel, 365 = annuel</p>
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="nextDueDate">Premiere echeance</label>
            <input className="field" id="nextDueDate" name="nextDueDate" type="date" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="label" htmlFor="description">Description (optionnel)</label>
            <textarea className="field min-h-24" id="description" name="description" placeholder="Actions a realiser, checklist, consignes..." />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button className="primary-button" type="submit">Creer le plan</button>
          </div>
        </form>
      </section>
    </div>
  );
}
