import { RequestStatus, Role } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatLocation } from "@/lib/utils";
import { deleteArchivedRequestAction } from "@/app/actions";

const PAGE_SIZE = 20;

type ArchivesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivesPage({ searchParams }: ArchivesPageProps) {
  const user = await requireUser();

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    redirect("/demandes");
  }

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
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
          <Link href="/demandes" className="secondary-button">
            Retour aux demandes
          </Link>
        }
      />

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

      <section className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="panel p-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
          >
            <Link href={`/demandes/${request.id}`} className="flex-1 space-y-3 hover:opacity-80 transition">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{request.number}</p>
                <StatusBadge kind="request" value={request.status} />
                <StatusBadge kind="urgency" value={request.urgency} />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">{request.equipment.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{formatLocation(request.equipment.location)}</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{requestIssueTypeLabels[request.issueType]} - {request.description}</p>
              <p className="text-sm text-slate-500">
                Demandeur : {request.requester.firstName} {request.requester.lastName} | Cloturee le {formatDateTime(request.updatedAt)}
              </p>
            </Link>
            <form action={deleteArchivedRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </form>
          </div>
        ))}
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
