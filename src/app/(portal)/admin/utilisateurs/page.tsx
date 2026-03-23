import { Role } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { roleLabels } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { toggleUserActiveAction } from "@/app/actions";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const roleFilterOptions = [
  { value: "", label: "Tous les roles" },
  { value: "USER", label: "Personnel" },
  { value: "TECHNICIAN", label: "Technicien" },
  { value: "MANAGER", label: "Responsable technique" },
  { value: "ADMIN", label: "Administrateur" },
];

const statusFilterOptions = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
];

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await requireRole([Role.SUPER_ADMIN, Role.ADMIN]);
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;
  const estFilter = currentUser.establishmentId ? { establishmentId: currentUser.establishmentId } : {};
  const isSA = currentUser.role === "SUPER_ADMIN";

  const roleFilter = typeof params.role === "string" ? params.role : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const estFilterParam = typeof params.est === "string" ? params.est : "";

  const establishments = isSA
    ? await prisma.establishment.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const users = await prisma.user.findMany({
    where: {
      ...estFilter,
      ...(roleFilter ? { role: roleFilter as Role } : {}),
      ...(statusFilter === "active" ? { active: true } : statusFilter === "inactive" ? { active: false } : {}),
      ...(isSA && estFilterParam ? { establishmentId: estFilterParam } : {}),
    },
    include: { establishment: isSA ? { select: { name: true } } : false },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Utilisateurs <span className="text-sm font-normal text-gray-400 ml-1">({users.length})</span></h1>
        <Link href="/admin/utilisateurs/new" className="primary-button gap-2 text-xs py-2 px-3">
          <Plus className="h-3.5 w-3.5" />
          Nouvel utilisateur
        </Link>
      </div>

      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">{success}</div> : null}

      {/* Filtres */}
      <form className="flex flex-wrap items-center gap-2">
        <select name="role" defaultValue={roleFilter} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
          {roleFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
          {statusFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {isSA ? (
          <select name="est" defaultValue={estFilterParam} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
            <option value="">Tous les etablissements</option>
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        ) : null}
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">Filtrer</button>
        {(roleFilter || statusFilter || estFilterParam) ? (
          <Link href="/admin/utilisateurs" className="text-xs text-gray-400 hover:text-gray-600 transition">Reinitialiser</Link>
        ) : null}
      </form>

      <section className="panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Statut</th>
              {isSA ? <th className="px-3 py-2">Etablissement</th> : null}
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {users.map((u) => (
              <tr key={u.id} className="group hover:bg-indigo-50/30 transition">
                <td className="px-3 py-1.5 font-semibold text-gray-900 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                <td className="px-3 py-1.5 text-gray-500">{u.email}</td>
                <td className="px-3 py-1.5">
                  <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${u.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {u.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                {isSA ? (
                  <td className="px-3 py-1.5 text-[11px] text-indigo-500 font-medium">
                    {"establishment" in u && u.establishment ? (u.establishment as { name: string }).name : <span className="text-gray-300">—</span>}
                  </td>
                ) : null}
                <td className="px-3 py-1.5 text-[11px] text-gray-400">{u.service ?? "—"}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/admin/utilisateurs/${u.id}/edit`} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition">
                      Modifier
                    </Link>
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition ${u.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
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
          <p className="text-center py-6 text-gray-400 text-xs">Aucun utilisateur avec ces filtres</p>
        ) : null}
      </section>
    </div>
  );
}
