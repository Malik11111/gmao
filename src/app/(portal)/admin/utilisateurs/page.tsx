import { Role } from "@prisma/client";
import { Plus, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { roleLabels } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { toggleUserActiveAction } from "@/app/actions";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await requireRole([Role.SUPER_ADMIN, Role.ADMIN]);
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;
  const estFilter = currentUser.establishmentId ? { establishmentId: currentUser.establishmentId } : {};

  const users = await prisma.user.findMany({
    where: { ...estFilter },
    include: { establishment: currentUser.role === "SUPER_ADMIN" ? { select: { name: true } } : false },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Creer, modifier et activer/desactiver les comptes du personnel."
        actions={
          <Link href="/admin/utilisateurs/new" className="primary-button gap-2">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Link>
        }
      />

      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div> : null}

      <section className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5">Utilisateur</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Statut</th>
              {currentUser.role === "SUPER_ADMIN" ? <th className="px-4 py-2.5">Etablissement</th> : null}
              <th className="px-4 py-2.5">Service</th>
              <th className="px-4 py-2.5 w-32" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="group hover:bg-indigo-50/30 transition">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${u.active ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"}`}>
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-xs leading-tight">{u.firstName} {u.lastName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${u.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {u.active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                    {u.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                {currentUser.role === "SUPER_ADMIN" ? (
                  <td className="px-4 py-2.5 text-[11px] text-indigo-500 font-medium">
                    {"establishment" in u && u.establishment ? (u.establishment as { name: string }).name : <span className="text-gray-300">—</span>}
                  </td>
                ) : null}
                <td className="px-4 py-2.5 text-[11px] text-gray-400">{u.service ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Link href={`/admin/utilisateurs/${u.id}/edit`} className="rounded border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition">
                      Modifier
                    </Link>
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition ${u.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        {u.active ? "Desactiver" : "Activer"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Aucun utilisateur</p>
        ) : null}
      </section>
    </div>
  );
}
