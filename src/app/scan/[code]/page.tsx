import { ClipboardPlus, LogIn, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels } from "@/lib/labels";
import { getSessionUser } from "@/lib/session";
import { formatDateTime, formatLocation } from "@/lib/utils";

type ScanPageProps = {
  params: Promise<{ code: string }>;
};

export default async function ScanPage({ params }: ScanPageProps) {
  const { code } = await params;
  const [equipment, user] = await Promise.all([
    prisma.equipment.findUnique({
      where: { qrCode: code },
      include: {
        location: true,
        requests: {
          include: {
            requester: true,
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    getSessionUser(),
  ]);

  if (!equipment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_22%),linear-gradient(180deg,#fffaf2_0%,#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="panel p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                <QrCode className="h-4 w-4" />
                Scan equipement
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{equipment.name}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{formatLocation(equipment.location)}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusBadge kind="equipment" value={equipment.status} />
                <p className="text-sm font-medium text-slate-500">{equipment.code}</p>
              </div>
            </div>

            {user ? (
              <Link href={`/signaler/${equipment.id}`} className="primary-button gap-2">
                <ClipboardPlus className="h-4 w-4" />
                Signaler un probleme
              </Link>
            ) : (
              <Link href="/login" className="primary-button gap-2">
                <LogIn className="h-4 w-4" />
                Se connecter pour signaler
              </Link>
            )}
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Historique recent</p>
            <div className="mt-6 space-y-4">
              {equipment.requests.length > 0 ? (
                equipment.requests.map((request) => (
                  <div key={request.id} className="rounded-[24px] border border-slate-200 bg-white/85 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-950">{request.number}</p>
                      <StatusBadge kind="request" value={request.status} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-900">{requestIssueTypeLabels[request.issueType]}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p>
                    <p className="mt-4 text-sm text-slate-500">
                      {request.requester.firstName} {request.requester.lastName} - {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="helper">Aucune intervention recente n&apos;est enregistree pour cet equipement.</p>
              )}
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Prochaine etape</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Signaler en moins de 30 secondes</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>1. Verifie l&apos;equipement et son emplacement.</p>
              <p>2. Clique sur le bouton pour ouvrir le formulaire pre-rempli.</p>
              <p>3. Decris le probleme et ajoute des photos si besoin.</p>
            </div>
            {user ? (
              <Link href={`/signaler/${equipment.id}`} className="secondary-button mt-6 w-full justify-center">
                Continuer vers le formulaire
              </Link>
            ) : (
              <Link href="/login" className="secondary-button mt-6 w-full justify-center">
                Ouvrir la connexion
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
