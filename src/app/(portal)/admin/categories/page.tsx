import { Plus } from "lucide-react";
import Link from "next/link";
import { deleteCategoryAction } from "@/app/actions";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Role } from "@prisma/client";

export default async function CategoriesPage() {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);

  const categories = await prisma.equipmentCategory.findMany({
    where: { ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    include: {
      _count: { select: { equipments: true } },
      specialists: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Categories <span className="text-sm font-normal text-gray-400 ml-1">({categories.length})</span></h1>
        <Link href="/admin/categories/new" className="primary-button gap-2 text-xs py-2 px-3">
          <Plus className="h-3.5 w-3.5" />
          Nouvelle categorie
        </Link>
      </div>

      <section className="panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Equipements</th>
              <th className="px-3 py-2 hidden lg:table-cell">Prestataire / Techniciens</th>
              <th className="px-3 py-2 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {categories.map((cat) => (
              <tr key={cat.id} className="group hover:bg-indigo-50/30 transition">
                <td className="px-3 py-1.5 font-semibold text-gray-900">{cat.name}</td>
                <td className="px-3 py-1.5">
                  {cat.isExternal ? (
                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Externe</span>
                  ) : (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Interne</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-gray-500">{cat._count.equipments}</td>
                <td className="px-3 py-1.5 hidden lg:table-cell">
                  {cat.isExternal && cat.contractorName ? (
                    <span className="text-[11px] text-amber-700">{cat.contractorName}{cat.contractorPhone ? ` — ${cat.contractorPhone}` : ""}</span>
                  ) : !cat.isExternal && cat.specialists.length > 0 ? (
                    <span className="text-[11px] text-indigo-600">{cat.specialists.map((s) => `${s.firstName} ${s.lastName[0]}.`).join(", ")}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/admin/categories/${cat.id}/edit`} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition">
                      Modifier
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={cat.id} />
                      <button type="submit" className="rounded border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 transition">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-xs">Aucune categorie</p>
        ) : null}
      </section>
    </div>
  );
}
