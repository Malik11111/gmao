import { Role } from "@prisma/client";
import { Plus, Search, UserCheck, UserX } from "lucide-react";
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
  await requireRole([Role.ADMIN]);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const success = typeof params.success === "string" ? params.success : undefined;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {},
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="space-y-6">
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

      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="panel p-5">
        <form className="flex gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="field pl-10" type="search" name="q" placeholder="Rechercher un utilisateur" defaultValue={q} />
          </div>
          <button className="secondary-button" type="submit">Filtrer</button>
        </form>
      </section>

      <section className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="panel p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${u.active ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"}`}>
                {u.firstName[0]}{u.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {roleLabels[u.role]}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${u.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {u.active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                {u.active ? "Actif" : "Inactif"}
              </span>
              {u.service ? <span className="text-xs text-gray-400">{u.service}</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/admin/utilisateurs/${u.id}/edit`} className="secondary-button text-xs py-1.5 px-3">
                Modifier
              </Link>
              <form action={toggleUserActiveAction}>
                <input type="hidden" name="userId" value={u.id} />
                <button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${u.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                  {u.active ? "Desactiver" : "Activer"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
