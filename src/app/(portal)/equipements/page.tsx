import { EquipmentStatus } from "@prisma/client";
import { ChevronRight, Download, Plus, Search } from "lucide-react";
import Link from "next/link";
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
        _count: { select: { requests: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Equipements <span className="text-sm font-normal text-gray-400 ml-1">({equipments.length})</span></h1>
        {canManageEquipment(user.role) ? (
          <div className="flex items-center gap-2">
            <a href="/api/equipements/export" className="secondary-button gap-2 text-xs py-2 px-3">
              <Download className="h-3.5 w-3.5" />
              Excel
            </a>
            <Link href="/equipements/new" className="primary-button gap-2 text-xs py-2 px-3">
              <Plus className="h-3.5 w-3.5" />
              Nouvel equipement
            </Link>
          </div>
        ) : null}
      </div>

      {/* Filtres compacts */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-indigo-400" type="search" name="q" placeholder="Rechercher..." defaultValue={q} />
        </div>
        <select name="status" defaultValue={status} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
          <option value="">Tous statuts</option>
          {equipmentStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select name="category" defaultValue={categoryId} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
          <option value="">Toutes categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">Filtrer</button>
        {(q || status || categoryId) ? (
          <Link href="/equipements" className="text-xs text-gray-400 hover:text-gray-600 transition">Reinitialiser</Link>
        ) : null}
      </form>

      {/* Desktop table */}
      <section className="panel hidden lg:block overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Categorie</th>
              <th className="px-3 py-2">Localisation</th>
              <th className="px-3 py-2">Demandes</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {equipments.map((eq) => (
              <tr key={eq.id} className="group hover:bg-indigo-50/30 transition">
                <td className="px-3 py-1.5">
                  <Link href={`/equipements/${eq.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition">{eq.name}</Link>
                </td>
                <td className="px-3 py-1.5 text-gray-400">{eq.code}</td>
                <td className="px-3 py-1.5">
                  {eq.category ? (
                    <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">{eq.category.name}</span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-1.5 text-gray-500 text-[11px]">{formatLocation(eq.location)}</td>
                <td className="px-3 py-1.5 text-gray-500">{eq._count.requests}</td>
                <td className="px-3 py-1.5"><StatusBadge kind="equipment" value={eq.status} /></td>
                <td className="px-3 py-1.5">
                  <Link href={`/equipements/${eq.id}`} className="text-gray-300 group-hover:text-indigo-600 transition">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipments.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-xs">Aucun equipement</p>
        ) : null}
      </section>

      {/* Mobile cards */}
      <section className="lg:hidden space-y-2">
        {equipments.map((eq) => (
          <Link key={eq.id} href={`/equipements/${eq.id}`} className="panel flex items-center justify-between gap-3 p-3 transition hover:border-slate-300">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-950 text-xs truncate">{eq.name}</p>
                <span className="text-[10px] text-slate-400">{eq.code}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{eq.category?.name ?? "—"} · {formatLocation(eq.location)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge kind="equipment" value={eq.status} />
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </Link>
        ))}
        {equipments.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-xs panel">Aucun equipement</p>
        ) : null}
      </section>
    </div>
  );
}
