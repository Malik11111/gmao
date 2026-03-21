import { EquipmentStatus } from "@prisma/client";
import { ChevronRight, Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { equipmentStatusOptions } from "@/lib/labels";
import { canManageEquipment, requireUser } from "@/lib/session";
import { formatLocation } from "@/lib/utils";

type EquipementsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EquipementsPage({ searchParams }: EquipementsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const categoryId = typeof params.category === "string" ? params.category : "";

  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const [categories, equipments] = await Promise.all([
    prisma.equipmentCategory.findMany({ where: { ...estFilter }, orderBy: { name: "asc" } }),
    prisma.equipment.findMany({
      where: {
        ...estFilter,
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

      {/* Desktop table */}
      <section className="panel hidden lg:block overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Designation</th>
              <th className="px-5 py-3">Categorie</th>
              <th className="px-5 py-3">Localisation</th>
              <th className="px-5 py-3">Demandes</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipments.map((equipment) => (
              <tr key={equipment.id} className="group transition hover:bg-indigo-50/40">
                <td className="px-5 py-3.5">
                  <Link href={`/equipements/${equipment.id}`} className="block">
                    <p className="font-semibold text-slate-950">{equipment.name}</p>
                    <p className="text-xs text-slate-400">{equipment.code}</p>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  {equipment.category ? (
                    <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{equipment.category.name}</span>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{formatLocation(equipment.location)}</td>
                <td className="px-5 py-3.5 text-slate-600">{equipment._count.requests}</td>
                <td className="px-5 py-3.5"><StatusBadge kind="equipment" value={equipment.status} /></td>
                <td className="px-5 py-3.5">
                  <Link href={`/equipements/${equipment.id}`} className="text-slate-400 group-hover:text-indigo-600 transition">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Mobile cards */}
      <section className="lg:hidden space-y-2">
        {equipments.map((equipment) => (
          <Link
            key={equipment.id}
            href={`/equipements/${equipment.id}`}
            className="panel flex items-center justify-between gap-3 p-4 transition hover:border-slate-300"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-950 truncate">{equipment.name}</p>
                <span className="text-xs text-slate-400">{equipment.code}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{equipment.category?.name ?? "-"} - {formatLocation(equipment.location)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge kind="equipment" value={equipment.status} />
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </section>

      {equipments.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">Aucun equipement ne correspond aux filtres</h2>
          <p className="mt-2 text-sm text-slate-500">Ajuste la recherche ou cree un nouvel equipement.</p>
        </section>
      ) : null}
    </div>
  );
}
