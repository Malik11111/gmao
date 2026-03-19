import { Role } from "@prisma/client";
import { CalendarClock, Camera, Mail, MessageSquare, QrCode, UserRound, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommentAction, updateRequestAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels, requestStatusOptions } from "@/lib/labels";
import { canOperateRequests, requireUser } from "@/lib/session";
import { formatDate, formatDateTime, formatLocation, readStringArray } from "@/lib/utils";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RequestDetailPage({ params, searchParams }: RequestDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const qp = await searchParams;
  const error = typeof qp.error === "string" ? qp.error : undefined;
  const success = typeof qp.success === "string" ? qp.success : undefined;

  const [request, technicians] = await Promise.all([
    prisma.request.findFirst({
      where: { id, ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
      include: {
        equipment: {
          include: { location: true, category: true },
        },
        requester: true,
        assignedTo: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        history: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: [Role.TECHNICIAN, Role.MANAGER, Role.ADMIN],
        },
        active: true,
        ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}),
      },
      orderBy: [{ role: "asc" }, { lastName: "asc" }],
    }),
  ]);

  if (!request) {
    notFound();
  }

  if (user.role === "USER" && request.requesterId !== user.id) {
    notFound();
  }

  const canUpdate = canOperateRequests(user.role);
  const photos = readStringArray(request.photos);
  const category = request.equipment.category;
  const isExternal = category?.isExternal && category?.contractorEmail;

  const mailtoUrl = isExternal
    ? `mailto:${category.contractorEmail}?subject=${encodeURIComponent(
        `Demande d'intervention ${request.number} - ${request.equipment.name}`
      )}&body=${encodeURIComponent(
        `Bonjour,\n\nNous souhaitons vous signaler un probleme sur l'equipement suivant :\n\n` +
        `Equipement : ${request.equipment.name}\n` +
        `Localisation : ${formatLocation(request.equipment.location)}\n` +
        `Type de probleme : ${requestIssueTypeLabels[request.issueType]}\n` +
        `Urgence : ${request.urgency}\n` +
        `Description : ${request.description}\n\n` +
        `Numero de demande : ${request.number}\n\n` +
        `Merci de nous contacter pour planifier l'intervention.\n\nCordialement`
      )}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={request.number}
        description={`Suivi detaille de la demande sur ${request.equipment.name}.`}
        actions={
          <>
            <Link href={`/equipements/${request.equipment.id}`} className="secondary-button gap-2">
              <QrCode className="h-4 w-4" />
              Fiche equipement
            </Link>
            <Link href="/demandes" className="secondary-button">
              Retour a la liste
            </Link>
          </>
        }
      />

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge kind="request" value={request.status} />
              <StatusBadge kind="urgency" value={request.urgency} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Equipement</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{request.equipment.name}</p>
                <p className="mt-1 text-sm text-slate-600">{formatLocation(request.equipment.location)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Type de probleme</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{requestIssueTypeLabels[request.issueType]}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Demandeur</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {request.requester.firstName} {request.requester.lastName}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assigne a</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "Non assigne"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Description</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{request.description}</p>
            </div>

            {photos.length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Camera className="h-4 w-4" />
                  Photos du signalement
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {photos.map((photo) => (
                    <Image
                      key={photo}
                      src={photo}
                      alt={request.number}
                      width={900}
                      height={600}
                      className="h-52 w-full rounded-[24px] border border-slate-200 object-cover shadow-sm"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              <MessageSquare className="h-4 w-4" />
              Echanges
            </div>
            <div className="mt-6 space-y-4">
              {request.comments.length > 0 ? (
                request.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <UserRound className="h-4 w-4" />
                        {comment.author.firstName} {comment.author.lastName}
                      </div>
                      <p className="text-sm text-slate-500">{formatDateTime(comment.createdAt)}</p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.message}</p>
                  </div>
                ))
              ) : (
                <p className="helper">Aucun commentaire pour le moment.</p>
              )}
            </div>

            <form action={addCommentAction} className="mt-6 space-y-4">
              <input type="hidden" name="requestId" value={request.id} />
              <div className="space-y-2">
                <label className="label" htmlFor="message">
                  Ajouter un commentaire
                </label>
                <textarea className="field min-h-32" id="message" name="message" placeholder="Precisions, retour de diagnostic, information au demandeur..." />
              </div>
              <button className="secondary-button" type="submit">
                Envoyer le commentaire
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              <CalendarClock className="h-4 w-4" />
              Dates clefs
            </div>
            <div className="mt-5 space-y-4 rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm text-slate-600">
              <p>Creation : {formatDateTime(request.createdAt)}</p>
              <p>Derniere mise a jour : {formatDateTime(request.updatedAt)}</p>
              <p>Echeance : {formatDate(request.dueDate)}</p>
              <p>Priorite technique : {request.technicalPriority ?? "Non definie"}</p>
            </div>
          </div>

          {canUpdate ? (
            <div className="panel p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                <Wrench className="h-4 w-4" />
                Pilotage technique
              </div>

              <form action={updateRequestAction} className="mt-5 space-y-4">
                <input type="hidden" name="requestId" value={request.id} />

                <div className="space-y-2">
                  <label className="label" htmlFor="status">
                    Statut
                  </label>
                  <select className="field" id="status" name="status" defaultValue={request.status}>
                    {requestStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label" htmlFor="assignedToId">
                    Technicien / responsable assigne
                  </label>
                  <select className="field" id="assignedToId" name="assignedToId" defaultValue={request.assignedToId ?? ""}>
                    <option value="">Non assigne</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.firstName} {technician.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label" htmlFor="technicalPriority">
                    Priorite technique
                  </label>
                  <select className="field" id="technicalPriority" name="technicalPriority" defaultValue={request.technicalPriority ?? ""}>
                    <option value="">Non definie</option>
                    <option value="Basse">Basse</option>
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                    <option value="Critique">Critique</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label" htmlFor="dueDate">
                    Date d&apos;echeance
                  </label>
                  <input className="field" id="dueDate" name="dueDate" type="date" defaultValue={request.dueDate ? new Date(request.dueDate).toISOString().slice(0, 10) : ""} />
                </div>

                <div className="space-y-2">
                  <label className="label" htmlFor="resolutionNotes">
                    Notes de resolution
                  </label>
                  <textarea className="field min-h-28" id="resolutionNotes" name="resolutionNotes" defaultValue={request.resolutionNotes ?? ""} placeholder="Actions realisees, pieces en attente, consignes..." />
                </div>

                <div className="space-y-2">
                  <label className="label" htmlFor="statusComment">
                    Commentaire d&apos;historique
                  </label>
                  <textarea className="field min-h-24" id="statusComment" name="statusComment" placeholder="Commentaire visible dans l'historique des statuts" />
                </div>

                <button className="primary-button w-full justify-center" type="submit">
                  Enregistrer les changements
                </button>
              </form>
            </div>
          ) : null}

          {isExternal && canUpdate ? (
            <div className="panel p-6 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                <Mail className="h-4 w-4" />
                Prestataire externe
              </div>
              <div className="mt-4 rounded-[24px] border border-amber-200 bg-white/85 p-4">
                <p className="text-sm font-semibold text-slate-950">{category.contractorName}</p>
                <p className="mt-1 text-sm text-slate-600">{category.contractorEmail}</p>
              </div>
              <a
                href={mailtoUrl!}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25"
              >
                <Mail className="h-4 w-4" />
                Contacter le prestataire
              </a>
            </div>
          ) : null}

          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Historique des statuts</p>
            <div className="mt-5 space-y-3">
              {request.history.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 bg-white/85 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <StatusBadge kind="request" value={item.toStatus} />
                    <p className="text-sm text-slate-500">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : "Systeme"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.comment ?? "Aucun commentaire."}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
