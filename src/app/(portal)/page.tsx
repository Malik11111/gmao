import { AlertTriangle, Boxes, ChevronRight, ClipboardList, Plus, TimerReset } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { QrScanner } from "@/components/qr-scanner";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db";
import { requestIssueTypeLabels } from "@/lib/labels";
import { canManageEquipment, requireUser } from "@/lib/session";
import { formatDateTime, formatLocation } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  // Personnel n'a pas besoin du tableau de bord → redirigé vers ses demandes
  if (user.role === "USER") {
    redirect("/demandes");
  }

  // SUPER_ADMIN → redirigé vers la gestion des établissements
  if (user.role === "SUPER_ADMIN") {
    redirect("/admin/etablissements");
  }

  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};
  const techFilter = user.role === "TECHNICIAN" ? { assignedToId: user.id } : {};

  const [equipmentCount, alertEquipmentCount, openRequestCount, criticalRequestCount, recentRequests, alerts] = await Promise.all([
    prisma.equipment.count({ where: { ...estFilter } }),
    prisma.equipment.count({
      where: { status: { in: ["OUT_OF_ORDER", "IN_REPAIR"] }, ...estFilter },
    }),
    prisma.request.count({
      where: { status: { in: ["NEW", "ACKNOWLEDGED", "WAITING", "IN_PROGRESS"] }, ...estFilter, ...techFilter },
    }),
    prisma.request.count({
      where: { urgency: "CRITICAL", status: { notIn: ["DONE", "CLOSED", "REJECTED"] }, ...estFilter, ...techFilter },
    }),
    prisma.request.findMany({
      where: { ...estFilter, ...techFilter },
      orderBy: { createdAt: "desc" },
      include: {
        equipment: { include: { location: true } },
        requester: true,
      },
      take: 5,
    }),
    prisma.equipment.findMany({
      where: { status: { in: ["OUT_OF_ORDER", "IN_REPAIR"] }, ...estFilter },
      include: { location: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la maintenance : equipements, alertes et demandes en cours."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/demandes" className="secondary-button gap-2">
              <ClipboardList className="h-4 w-4" />
              Demandes
            </Link>
            <div className="lg:hidden">
              <QrScanner />
            </div>
            {canManageEquipment(user.role) ? (
              <Link href="/equipements/new" className="primary-button gap-2">
                <Plus className="h-4 w-4" />
                Nouvel equipement
              </Link>
            ) : null}
          </div>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard eyebrow="Parc" value={String(equipmentCount)} description="Equipements suivis" icon={<Boxes className="h-5 w-5" />} color="indigo" />
        <StatCard eyebrow="Alertes" value={String(alertEquipmentCount)} description="En panne ou reparation" icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
        <StatCard eyebrow="Ouvertes" value={String(openRequestCount)} description="Demandes a traiter" icon={<ClipboardList className="h-5 w-5" />} color="emerald" />
        <StatCard eyebrow="Critiques" value={String(criticalRequestCount)} description="Urgences actives" icon={<TimerReset className="h-5 w-5" />} color="rose" />
      </section>

      {/* Recent requests — desktop table */}
      <section className="panel hidden lg:block overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Demandes recentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Dernieres demandes d&apos;intervention</p>
          </div>
          <Link href="/demandes" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
            Tout voir
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Numero</th>
              <th className="px-5 py-3">Equipement</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Urgence</th>
              <th className="px-5 py-3">Demandeur</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentRequests.map((request) => (
              <tr key={request.id} className="group transition hover:bg-indigo-50/40">
                <td className="px-5 py-3.5">
                  <Link href={`/demandes/${request.id}`} className="font-semibold text-slate-950">{request.number}</Link>
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/demandes/${request.id}`} className="block">
                    <p className="font-medium text-slate-900">{request.equipment?.name ?? request.anomalyLabel ?? "Anomalie"}</p>
                    <p className="text-xs text-slate-400">{request.equipment ? formatLocation(request.equipment.location) : ""}</p>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{requestIssueTypeLabels[request.issueType]}</td>
                <td className="px-5 py-3.5"><StatusBadge kind="request" value={request.status} /></td>
                <td className="px-5 py-3.5"><StatusBadge kind="urgency" value={request.urgency} /></td>
                <td className="px-5 py-3.5 text-slate-600 text-xs">{request.requester.firstName} {request.requester.lastName}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(request.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <Link href={`/demandes/${request.id}`} className="text-slate-400 group-hover:text-indigo-600 transition">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentRequests.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Aucune demande pour le moment</p>
        ) : null}
      </section>

      {/* Recent requests — mobile cards */}
      <section className="lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Demandes recentes</h2>
          <Link href="/demandes" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">Tout voir</Link>
        </div>
        <div className="space-y-2">
          {recentRequests.map((request) => (
            <Link key={request.id} href={`/demandes/${request.id}`} className="panel flex items-center justify-between gap-3 p-4 transition hover:border-slate-300">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">{request.number}</span>
                  <StatusBadge kind="request" value={request.status} />
                  <StatusBadge kind="urgency" value={request.urgency} />
                </div>
                <p className="font-semibold text-slate-950 truncate mt-1">{request.equipment?.name ?? request.anomalyLabel ?? "Anomalie"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{requestIssueTypeLabels[request.issueType]} - {formatDateTime(request.createdAt)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </Link>
          ))}
          {recentRequests.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Aucune demande pour le moment</p>
          ) : null}
        </div>
      </section>

      {/* Equipment alerts — desktop table */}
      <section className="panel hidden lg:block overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-gray-900">Points chauds</h2>
          <p className="text-xs text-gray-400 mt-0.5">Equipements sous surveillance</p>
        </div>
        {alerts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Equipement</th>
                <th className="px-5 py-3">Localisation</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((equipment) => (
                <tr key={equipment.id} className="group transition hover:bg-indigo-50/40">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{equipment.name}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{formatLocation(equipment.location)}</td>
                  <td className="px-5 py-3.5"><StatusBadge kind="equipment" value={equipment.status} /></td>
                  <td className="px-5 py-3.5">
                    <Link href={`/equipements/${equipment.id}`} className="text-slate-400 group-hover:text-indigo-600 transition">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400 px-5 py-6">Aucun equipement en alerte</p>
        )}
      </section>

      {/* Equipment alerts — mobile */}
      <section className="lg:hidden">
        <h2 className="text-base font-bold text-gray-900 mb-3">Points chauds</h2>
        <div className="space-y-2">
          {alerts.length > 0 ? alerts.map((equipment) => (
            <Link key={equipment.id} href={`/equipements/${equipment.id}`} className="panel flex items-center justify-between gap-3 p-4 transition hover:border-slate-300">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{equipment.name}</p>
                <p className="text-xs text-slate-500 truncate">{formatLocation(equipment.location)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge kind="equipment" value={equipment.status} />
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          )) : (
            <p className="text-sm text-gray-400 panel p-6 text-center">Aucun equipement en alerte</p>
          )}
        </div>
      </section>

      {/* Quick help */}
      <section className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/20">
        <h2 className="text-base font-bold">Comment signaler ?</h2>
        <div className="mt-4 space-y-3 text-sm text-indigo-100">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold flex-shrink-0">1</span>
            <p>Scannez le QR code sur l&apos;equipement</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold flex-shrink-0">2</span>
            <p>Verifiez la fiche et cliquez sur &quot;Signaler&quot;</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold flex-shrink-0">3</span>
            <p>Decrivez le probleme et envoyez</p>
          </div>
        </div>
      </section>
    </div>
  );
}
