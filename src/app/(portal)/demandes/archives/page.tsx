import { RequestStatus, Role } from "@prisma/client";
import { Archive, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatLocation } from "@/lib/utils";
import { archiveNowAction, deleteArchivedRequestAction } from "@/app/actions";

const PAGE_SIZE = 20;

type ArchivesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivesPage({ searchParams }: ArchivesPageProps) {
  const user = await requireUser();

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "MANAGER") {
    redirect("/demandes");
  }

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const success = typeof params.success === "string" ? params.success : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const where = {
    status: RequestStatus.ARCHIVED,
    ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { description: { contains: q } },
            { equipment: { is: { name: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [requests, totalCount] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        equipment: { include: { location: true } },
        requester: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.request.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function paginationUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/demandes/archives?${qs}` : "/demandes/archives";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archives"
        description={`${totalCount} demande${totalCount > 1 ? "s" : ""} archivee${totalCount > 1 ? "s" : ""}. Ces demandes ont ete cloturees puis archivees automatiquement.`}
        actions={
          <div className="flex items-center gap-3">
            <form action={archiveNowAction}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                <Archive className="h-4 w-4" />
                Archiver maintenant
              </button>
            </form>
            <Link href="/demandes" className="secondary-button">
              Retour aux demandes
            </Link>
          </div>
        }
      />

      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="panel p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="field pl-11" type="search" name="q" placeholder="Rechercher dans les archives..." defaultValue={q} />
          </div>
          <button className="secondary-button" type="submit">
            Rechercher
          </button>
        </form>
      </section>

      <section className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-left">Numéro</th>
              <th className="px-4 py-3 text-left">Équipement</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Urgence</th>
              <th className="px-4 py-3 text-left">Demandeur</th>
              <th className="px-4 py-3 text-left">Clôturée le</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  <Link href={`/demandes/${request.id}`} className="hover:text-indigo-600">{request.number}</Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/demandes/${request.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                    {request.equipment?.name ?? request.anomalyLabel ?? "Anomalie"}
                  </Link>
                  {request.equipment ? <p className="text-xs text-slate-400">{formatLocation(request.equipment.location)}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{requestIssueTypeLabels[request.issueType]}</td>
                <td className="px-4 py-3"><StatusBadge kind="urgency" value={request.urgency} /></td>
                <td className="px-4 py-3 text-slate-600">{request.requester.firstName} {request.requester.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(request.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteArchivedRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {requests.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Aucune archive</h2>
          <p className="mt-3 helper">Les demandes cloturees sont archivees automatiquement le 1er de chaque mois.</p>
        </section>
      ) : null}

      {totalPages > 1 ? (
        <section className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={paginationUrl(page - 1)} className="secondary-button gap-1">
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </Link>
          ) : null}
          <p className="text-sm text-slate-600">
            Page {page} sur {totalPages}
          </p>
          {page < totalPages ? (
            <Link href={paginationUrl(page + 1)} className="secondary-button gap-1">
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
