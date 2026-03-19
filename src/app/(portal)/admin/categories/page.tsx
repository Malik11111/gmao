import { Building2, ExternalLink, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { deleteCategoryAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Role } from "@prisma/client";

export default async function CategoriesPage() {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const categories = await prisma.equipmentCategory.findMany({
    include: {
      _count: { select: { equipments: true } },
      specialists: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories d'equipements"
        description="Gerez les categories, les prestataires externes et l'affectation automatique des techniciens."
        actions={
          <Link href="/admin/categories/new" className="primary-button gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle categorie
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.id} className="panel p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{cat.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{cat._count.equipments} equipement(s)</p>
              </div>
              {cat.isExternal ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                  <ExternalLink className="h-3 w-3" />
                  Externe
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Wrench className="h-3 w-3" />
                  Interne
                </span>
              )}
            </div>

            {cat.isExternal && cat.contractorName ? (
              <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3 space-y-1">
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  {cat.contractorName}
                </p>
                {cat.contractorPhone ? <p className="text-xs text-amber-700">Tel: {cat.contractorPhone}</p> : null}
                {cat.contractorEmail ? <p className="text-xs text-amber-700">Email: {cat.contractorEmail}</p> : null}
              </div>
            ) : null}

            {!cat.isExternal && cat.specialists.length > 0 ? (
              <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3">
                <p className="text-xs font-semibold text-indigo-600 mb-1">Technicien(s) affecte(s) :</p>
                <p className="text-sm text-indigo-900">
                  {cat.specialists.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <Link href={`/admin/categories/${cat.id}/edit`} className="secondary-button text-xs px-3 py-1.5">
                Modifier
              </Link>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={cat.id} />
                <button type="submit" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>

      {categories.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-xl font-semibold text-slate-950">Aucune categorie</h2>
          <p className="mt-2 text-sm text-slate-500">Creez votre premiere categorie d&apos;equipements.</p>
        </section>
      ) : null}
    </div>
  );
}
