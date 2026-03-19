import { RequestStatus } from "@prisma/client";
import { AlertCircle, ChevronLeft, ChevronRight, Download, LayoutGrid, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels, requestStatusOptions } from "@/lib/labels";
import { canOperateRequests, requireUser } from "@/lib/session";
import { formatDateTime, formatLocation } from "@/lib/utils";

const PAGE_SIZE = 20;

type RequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const where = {
    ...(user.role === "USER" ? { requesterId: user.id } : {}),
    ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}),
    ...(status ? { status: status as RequestStatus } : { status: { not: RequestStatus.ARCHIVED } }),
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
        equipment: {
          include: { location: true },
        },
        requester: true,
        assignedTo: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.request.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function paginationUrl(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/demandes?${qs}` : "/demandes";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === "USER" ? "Mes demandes" : "Demandes d'intervention"}
        description={
          user.role === "USER"
            ? "Retrouve l'etat de tes signalements et les echanges avec le service technique."
            : "Pilote les nouvelles demandes, les affectations et le suivi des interventions."
        }
        actions={
          canOperateRequests(user.role) ? (
            <div className="flex items-center gap-3">
              <a href="/api/demandes/export" className="secondary-button gap-2">
                <Download className="h-4 w-4" />
                Exporter Excel
              </a>
              <Link href="/demandes/kanban" className="secondary-button gap-2">
                <LayoutGrid className="h-4 w-4" />
                Vue Kanban
              </Link>
            </div>
          ) : (
            <Link href="/equipements" className="primary-button gap-2">
              <AlertCircle className="h-4 w-4" />
              Effectuer une demande
            </Link>
          )
        }
      />

      <section className="panel p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_260px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="field pl-11" type="search" name="q" placeholder="Numero, equipement ou description" defaultValue={q} />
          </div>
          <select className="field" name="status" defaultValue={status}>
            <option value="">Tous les statuts</option>
            {requestStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="submit">
            Filtrer
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {requests.map((request) => (
          <Link
            key={request.id}
            href={`/demandes/${request.id}`}
            className="panel block p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{request.number}</p>
                  <StatusBadge kind="request" value={request.status} />
                  <StatusBadge kind="urgency" value={request.urgency} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{request.equipment.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{formatLocation(request.equipment.location)}</p>
                </div>
                <p className="text-sm leading-6 text-slate-600">{requestIssueTypeLabels[request.issueType]} - {request.description}</p>
              </div>

              <div className="grid gap-3 text-sm text-slate-500">
                <p>
                  Demandeur : {request.requester.firstName} {request.requester.lastName}
                </p>
                <p>
                  Assigne : {request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "Non assigne"}
                </p>
                <p>Maj : {formatDateTime(request.updatedAt)}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {requests.length === 0 ? (
        <section className="panel p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Aucune demande a afficher</h2>
          <p className="mt-3 helper">Le flux est vide pour l&apos;instant ou aucun resultat ne correspond a la recherche.</p>
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
            Page {page} sur {totalPages} ({totalCount} demande{totalCount > 1 ? "s" : ""})
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
