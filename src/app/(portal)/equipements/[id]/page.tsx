import { Camera, FileClock, Pencil, Printer, QrCode, Siren, Trash2, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEquipmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels } from "@/lib/labels";
import { canManageEquipment, requireUser } from "@/lib/session";
import { formatDate, formatDateTime, formatLocation, readStringArray } from "@/lib/utils";

type EquipmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EquipmentDetailPage({ params, searchParams }: EquipmentDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const qp = await searchParams;
  const success = typeof qp.success === "string" ? qp.success : undefined;
  const errorMsg = typeof qp.error === "string" ? qp.error : undefined;

  const equipment = await prisma.equipment.findFirst({
    where: { id, ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    include: {
      category: true,
      location: true,
      requests: {
        include: {
          requester: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  if (!equipment) {
    notFound();
  }

  const photos = readStringArray(equipment.photos);

  return (
    <div className="space-y-6">
      <PageHeader
        title={equipment.name}
        description={`Fiche complete de l'equipement ${equipment.code} avec statut actuel, QR code de signalement et historique recent.`}
        actions={
          <>
            {canManageEquipment(user.role) ? (
              <Link href={`/equipements/${equipment.id}/edit`} className="secondary-button gap-2">
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            ) : null}
            <Link href={`/scan/${equipment.qrCode}`} className="secondary-button gap-2">
              <QrCode className="h-4 w-4" />
              Ouvrir la page scan
            </Link>
            <Link href={`/signaler/${equipment.id}`} className="primary-button gap-2">
              <Siren className="h-4 w-4" />
              Signaler un probleme
            </Link>
          </>
        }
      />

      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
      {errorMsg ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMsg}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge kind="equipment" value={equipment.status} />
              <p className="text-sm text-slate-500">{equipment.category?.name ?? "Categorie non renseignee"}</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Localisation</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatLocation(equipment.location)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Marque / modele</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{[equipment.brand, equipment.model].filter(Boolean).join(" ") || "Non renseigne"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Numero de serie</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{equipment.serialNumber ?? "Non renseigne"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Fournisseur</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{equipment.supplier ?? "Non renseigne"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Date d&apos;achat</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDate(equipment.purchaseDate)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Garantie</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDate(equipment.warrantyEndDate)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Wrench className="h-4 w-4" />
                Notes d&apos;exploitation
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{equipment.notes ?? "Aucune note pour le moment."}</p>
            </div>

            {photos.length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Camera className="h-4 w-4" />
                  Photos jointes
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${equipment.name} photo ${i + 1}`}
                      className="h-48 w-full rounded-[24px] border border-slate-200 object-cover shadow-sm"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              <FileClock className="h-4 w-4" />
              Historique recent
            </div>
            <div className="mt-6 space-y-4">
              {equipment.requests.length > 0 ? (
                equipment.requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/demandes/${request.id}`}
                    className="block rounded-[24px] border border-slate-200 bg-white/85 p-5 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-950">{request.number}</p>
                      <StatusBadge kind="request" value={request.status} />
                      <StatusBadge kind="urgency" value={request.urgency} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-800">{requestIssueTypeLabels[request.issueType]}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p>
                    <div className="mt-4 text-sm text-slate-500">
                      {request.requester.firstName} {request.requester.lastName} - {formatDateTime(request.createdAt)}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="helper">Aucune demande n&apos;a encore ete creee pour cet equipement.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              <QrCode className="h-4 w-4" />
              QR code
            </div>
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6">
              <Image
                src={`/api/qrcode/${equipment.qrCode}`}
                alt={`QR code ${equipment.code}`}
                width={288}
                height={288}
                className="mx-auto h-72 w-72 rounded-[24px] border border-slate-200 p-3"
              />
              <p className="mt-4 text-center text-sm font-semibold text-slate-900">{equipment.code}</p>
              <p className="mt-2 text-center text-sm leading-6 text-slate-600">
                A coller sur l&apos;equipement pour ouvrir la fiche publique de scan.
              </p>
              <Link
                href={`/equipements/${equipment.id}/qr-print`}
                className="secondary-button mt-4 w-full justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimer le QR code
              </Link>
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Action rapide</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Declarer un incident</h2>
            <p className="mt-3 helper">
              Ouvre le formulaire simplifie avec equipement et localisation pre-remplis pour gagner du temps.
            </p>
            <Link href={`/signaler/${equipment.id}`} className="primary-button mt-5 w-full justify-center gap-2">
              <Siren className="h-4 w-4" />
              Creer un signalement
            </Link>
          </div>

          {user.role === "ADMIN" ? (
            <div className="panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">Zone dangereuse</p>
              <p className="mt-3 text-sm text-slate-600">La suppression est irreversible et n&apos;est possible que si aucune demande n&apos;est liee.</p>
              <form action={deleteEquipmentAction} className="mt-4">
                <input type="hidden" name="id" value={equipment.id} />
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                  <Trash2 className="h-4 w-4" />
                  Supprimer l&apos;equipement
                </button>
              </form>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
