import { AlertTriangle, Boxes, ClipboardList, Plus, TimerReset } from "lucide-react";
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

  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const [equipmentCount, alertEquipmentCount, openRequestCount, criticalRequestCount, recentRequests, alerts] = await Promise.all([
    prisma.equipment.count({ where: { ...estFilter } }),
    prisma.equipment.count({
      where: { status: { in: ["OUT_OF_ORDER", "IN_REPAIR"] }, ...estFilter },
    }),
    prisma.request.count({
      where: { status: { in: ["NEW", "ACKNOWLEDGED", "WAITING", "IN_PROGRESS"] }, ...estFilter },
    }),
    prisma.request.count({
      where: { urgency: "CRITICAL", status: { notIn: ["DONE", "CLOSED", "REJECTED"] }, ...estFilter },
    }),
    prisma.request.findMany({
      where: { ...estFilter },
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

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Recent requests */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Demandes recentes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Dernieres demandes d&apos;intervention</p>
            </div>
            <Link href="/demandes" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
              Tout voir
            </Link>
          </div>

          <div className="space-y-3">
            {recentRequests.map((request) => (
              <Link
                key={request.id}
                href={`/demandes/${request.id}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">{request.number}</span>
                      <StatusBadge kind="request" value={request.status} />
                      <StatusBadge kind="urgency" value={request.urgency} />
                    </div>
                    <p className="font-semibold text-gray-900">{request.equipment.name}</p>
                    <p className="text-xs text-gray-500">{formatLocation(request.equipment.location)}</p>
                    <p className="text-sm text-gray-600">{requestIssueTypeLabels[request.issueType]} - {request.description}</p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    <p>{request.requester.firstName} {request.requester.lastName}</p>
                    <p className="mt-1">{formatDateTime(request.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}

            {recentRequests.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Aucune demande pour le moment</p>
            ) : null}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* Equipment alerts */}
          <div className="panel p-6">
            <h2 className="text-lg font-bold text-gray-900">Points chauds</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Equipements sous surveillance</p>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((equipment) => (
                  <Link
                    key={equipment.id}
                    href={`/equipements/${equipment.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3 transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{equipment.name}</p>
                      <p className="text-xs text-gray-500 truncate">{formatLocation(equipment.location)}</p>
                    </div>
                    <StatusBadge kind="equipment" value={equipment.status} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucun equipement en alerte</p>
              )}
            </div>
          </div>

          {/* Quick help */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/20">
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
          </div>
        </div>
      </section>
    </div>
  );
}
