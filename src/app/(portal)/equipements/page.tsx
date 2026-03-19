import { EquipmentStatus } from "@prisma/client";
import { Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { equipmentStatusOptions } from "@/lib/labels";
import { canManageEquipment, requireUser } from "@/lib/session";
import { formatDate, formatLocation } from "@/lib/utils";

type EquipementsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EquipementsPage({ searchParams }: EquipementsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const categoryId = typeof params.category === "string" ? params.category : "";

  const [categories, equipments] = await Promise.all([
    prisma.equipmentCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({
      where: {
        ...(status ? { status: status as EquipmentStatus } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { code: { contains: q } },
                { brand: { contains: q } },
                { location: { is: { building: { contains: q } } } },
                { location: { is: { room: { contains: q } } } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        location: true,
        _count: {
          select: { requests: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parc equipements"
        description="Inventaire centralise, visualisation des statuts et acces direct aux QR codes de chaque equipement."
        actions={
          canManageEquipment(user.role) ? (
            <div className="flex items-center gap-3">
              <a href="/api/equipements/export" className="secondary-button gap-2">
                <Download className="h-4 w-4" />
                Exporter Excel
              </a>
              <Link href="/equipements/new" className="primary-button gap-2">
                <Plus className="h-4 w-4" />
                Nouvel equipement
              </Link>
            </div>
          ) : null
        }
      />

      <section className="panel p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="field pl-11" type="search" name="q" placeholder="Rechercher un equipement, une marque ou un batiment" defaultValue={q} />
          </div>
          <select className="field" name="status" defaultValue={status}>
            <option value="">Tous les statuts</option>
            {equipmentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select className="field" name="category" defaultValue={categoryId}>
            <option value="">Toutes les categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="submit">
            Filtrer
          </button>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {equipments.map((equipment) => (
          <Link
            key={equipment.id}
            href={`/equipements/${equipment.id}`}
            className="panel flex flex-col gap-5 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{equipment.code}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{equipment.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {equipment.category?.name ?? "Categorie non renseignee"} - {formatLocation(equipment.location)}
                </p>
              </div>
              <StatusBadge kind="equipment" value={equipment.status} />
            </div>

            <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white/80 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Marque / modele</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {[equipment.brand, equipment.model].filter(Boolean).join(" ") || "Non renseigne"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Historique</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{equipment._count.requests} demande(s)</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Garantie</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDate(equipment.warrantyEndDate)}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {equipments.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Aucun equipement ne correspond aux filtres</h2>
          <p className="mt-3 helper">Ajuste la recherche ou cree un nouvel equipement pour enrichir l&apos;inventaire.</p>
        </section>
      ) : null}
    </div>
  );
}
