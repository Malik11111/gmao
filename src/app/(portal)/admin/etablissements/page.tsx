import { Role } from "@prisma/client";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { toggleEstablishmentActiveAction } from "@/app/actions";

export default async function EstablishmentsPage() {
  await requireRole([Role.SUPER_ADMIN]);

  const establishments = await prisma.establishment.findMany({
    include: {
      _count: { select: { users: true, equipments: true, requests: true } },
      users: { where: { role: Role.ADMIN }, select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etablissements"
        description="Gerez les etablissements et leurs administrateurs."
        actions={
          <Link href="/admin/etablissements/new" className="primary-button gap-2">
            <Plus className="h-4 w-4" />
            Nouvel etablissement
          </Link>
        }
      />

      <section className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-left">Etablissement</th>
              <th className="px-4 py-3 text-left">Administrateur</th>
              <th className="px-4 py-3 text-center">Utilisateurs</th>
              <th className="px-4 py-3 text-center">Equipements</th>
              <th className="px-4 py-3 text-center">Demandes</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {establishments.map((e) => {
              const admin = e.users[0];
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.address ?? e.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {admin ? (
                      <div>
                        <p className="text-slate-900">{admin.firstName} {admin.lastName}</p>
                        <p className="text-xs text-slate-400">{admin.email}</p>
                      </div>
                    ) : <span className="text-xs text-slate-400">Aucun</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{e._count.users}</td>
                  <td className="px-4 py-3 text-center font-medium">{e._count.equipments}</td>
                  <td className="px-4 py-3 text-center font-medium">{e._count.requests}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${e.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {e.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/etablissements/${e.id}/edit`} className="secondary-button text-xs py-1.5 px-3">
                        Modifier
                      </Link>
                      <form action={toggleEstablishmentActiveAction}>
                        <input type="hidden" name="establishmentId" value={e.id} />
                        <button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${e.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                          {e.active ? "Desactiver" : "Activer"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {establishments.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Aucun etablissement</h2>
          <p className="mt-3 helper">Creez votre premier etablissement pour commencer.</p>
        </section>
      ) : null}
    </div>
  );
}
