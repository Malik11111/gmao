import { Role } from "@prisma/client";
import { Clock, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CategoryChart, MonthlyChart, StatusChart, WeeklyAnomalyChart } from "@/components/stats-charts";
import { prisma } from "@/lib/db";
import { requestStatusLabels } from "@/lib/labels";
import { requireRole } from "@/lib/session";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  ACKNOWLEDGED: "#6366f1",
  WAITING: "#d97706",
  IN_PROGRESS: "#ea580c",
  DONE: "#059669",
  CLOSED: "#6b7280",
  REJECTED: "#dc2626",
  ARCHIVED: "#94a3b8",
};

export default async function StatistiquesPage() {
  const user = await requireRole([Role.ADMIN, Role.MANAGER, Role.TECHNICIAN]);
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [allRequests, equipmentsByCategory, statusCounts, totalEquipment, totalRequests, weeklyAnomalies] = await Promise.all([
    prisma.request.findMany({
      where: { createdAt: { gte: twelveMonthsAgo }, ...estFilter },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.equipment.findMany({
      where: { ...estFilter },
      select: { category: { select: { name: true } } },
    }),
    prisma.request.groupBy({
      by: ["status"],
      _count: true,
      where: { ...estFilter },
    }),
    prisma.equipment.count({ where: { ...estFilter } }),
    prisma.request.count({ where: { ...estFilter } }),
    prisma.request.findMany({
      where: { equipmentId: null, createdAt: { gte: sevenDaysAgo }, ...estFilter },
      select: { createdAt: true, urgency: true },
    }),
  ]);

  // Monthly data
  const monthlyMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const req of allRequests) {
    const d = new Date(req.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
  }
  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = Array.from(monthlyMap.entries()).map(([key, count]) => ({
    month: monthNames[parseInt(key.split("-")[1], 10) - 1],
    count,
  }));

  // Category data
  const categoryMap = new Map<string, number>();
  for (const eq of equipmentsByCategory) {
    const name = eq.category?.name ?? "Sans categorie";
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1);
  }
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Status data
  const statusData = statusCounts
    .map((s) => ({
      name: requestStatusLabels[s.status] ?? s.status,
      count: s._count,
      color: STATUS_COLORS[s.status] ?? "#6b7280",
    }))
    .sort((a, b) => b.count - a.count);

  // Weekly anomaly data (last 7 days)
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weeklyMap = new Map<string, { total: number; urgent: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    weeklyMap.set(key, { total: 0, urgent: 0 });
  }
  for (const a of weeklyAnomalies) {
    const key = new Date(a.createdAt).toISOString().slice(0, 10);
    if (weeklyMap.has(key)) {
      const entry = weeklyMap.get(key)!;
      entry.total += 1;
      if (a.urgency === "URGENT" || a.urgency === "CRITICAL") entry.urgent += 1;
    }
  }
  const weeklyData = Array.from(weeklyMap.entries()).map(([key, val]) => ({
    day: dayNames[new Date(key).getDay()],
    normal: val.total - val.urgent,
    urgent: val.urgent,
  }));

  // Average resolution (requests that reached DONE)
  const doneHistories = await prisma.statusHistory.findMany({
    where: { toStatus: "DONE", ...(user.establishmentId ? { request: { establishmentId: user.establishmentId } } : {}) },
    include: { request: { select: { createdAt: true } } },
  });

  let avgResolutionDays = 0;
  if (doneHistories.length > 0) {
    const totalMs = doneHistories.reduce((sum, h) => {
      return sum + (new Date(h.createdAt).getTime() - new Date(h.request.createdAt).getTime());
    }, 0);
    avgResolutionDays = Math.round(totalMs / doneHistories.length / (1000 * 60 * 60 * 24) * 10) / 10;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques"
        description="Indicateurs de performance et tendances de la maintenance sur les 12 derniers mois."
      />

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard eyebrow="Total equipements" value={String(totalEquipment)} description="Dans le parc" icon={<TrendingUp className="h-5 w-5" />} color="indigo" />
        <StatCard eyebrow="Total demandes" value={String(totalRequests)} description="Depuis le debut" icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
        <StatCard eyebrow="Ce mois" value={String(monthlyData[monthlyData.length - 1]?.count ?? 0)} description="Nouvelles demandes" icon={<TrendingUp className="h-5 w-5" />} color="amber" />
        <StatCard eyebrow="Temps moyen" value={avgResolutionDays > 0 ? `${avgResolutionDays}j` : "N/A"} description="Resolution moyenne" icon={<Clock className="h-5 w-5" />} color="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-4 lg:p-6">
          <h2 className="text-base font-bold text-gray-900">Demandes par mois</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Evolution sur 12 mois</p>
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="panel p-4 lg:p-6">
          <h2 className="text-base font-bold text-gray-900">Repartition par statut</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Toutes les demandes</p>
          <StatusChart data={statusData} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-900">Anomalies hebdomadaires</h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">Signalements sans equipement - 7 derniers jours</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />Normale</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-500" />Urgente</span>
            </div>
          </div>
          <WeeklyAnomalyChart data={weeklyData} />
        </div>

        <div className="panel p-4 lg:p-6">
          <h2 className="text-base font-bold text-gray-900">Equipements par categorie</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Distribution du parc</p>
          <CategoryChart data={categoryData} />
        </div>
      </section>
    </div>
  );
}
