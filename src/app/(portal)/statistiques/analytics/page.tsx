import { Role } from "@prisma/client";
import { AlertTriangle, Brain, Clock, Gauge, Shield, TrendingDown, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  MtbfChart,
  ResolutionTimeChart,
  RiskScoreChart,
  SeasonalChart,
  TrendPredictionChart,
} from "@/components/analytics-charts";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

/* ── Helper: linear regression ── */
function linearRegression(points: number[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0] ?? 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += points[i];
    sumXY += i * points[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default async function AnalyticsPage() {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const now = new Date();

  /* ── Fetch data ── */
  const [allRequests, allEquipments, doneRequests] = await Promise.all([
    prisma.request.findMany({
      where: { ...estFilter },
      select: {
        id: true,
        equipmentId: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        urgency: true,
        equipment: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.equipment.count({ where: { ...estFilter } }),
    prisma.request.findMany({
      where: { status: { in: ["DONE", "CLOSED"] }, ...estFilter },
      select: { createdAt: true, updatedAt: true, equipmentId: true, equipment: { select: { name: true } } },
    }),
  ]);

  /* ── KPI: MTTR (Mean Time To Repair) ── */
  let mttr = 0;
  const resolvedWithTime = doneRequests.filter(
    (r) => r.updatedAt.getTime() > r.createdAt.getTime(),
  );
  if (resolvedWithTime.length > 0) {
    const totalMs = resolvedWithTime.reduce(
      (sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()),
      0,
    );
    mttr = Math.round((totalMs / resolvedWithTime.length / (1000 * 60 * 60 * 24)) * 10) / 10;
  }

  /* ── KPI: Taux de resolution ── */
  const resolvedCount = allRequests.filter((r) =>
    ["DONE", "CLOSED", "ARCHIVED"].includes(r.status),
  ).length;
  const resolutionRate = allRequests.length > 0
    ? Math.round((resolvedCount / allRequests.length) * 100)
    : 0;

  /* ── KPI: Taux de criticite ── */
  const criticalCount = allRequests.filter(
    (r) => r.urgency === "CRITICAL" || r.urgency === "URGENT",
  ).length;
  const criticalRate = allRequests.length > 0
    ? Math.round((criticalCount / allRequests.length) * 100)
    : 0;

  /* ── KPI: Disponibilite parc ── */
  const openRequests = allRequests.filter((r) =>
    ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "WAITING"].includes(r.status),
  );
  const eqWithOpenPannes = new Set(openRequests.map((r) => r.equipmentId).filter(Boolean));
  const availability = allEquipments > 0
    ? Math.round(((allEquipments - eqWithOpenPannes.size) / allEquipments) * 100)
    : 100;

  /* ── Risk scoring per equipment ── */
  const eqMap = new Map<string, { name: string; pannes: number; recent: number; critical: number; avgResolution: number; resCount: number }>();

  for (const r of allRequests) {
    if (!r.equipment) continue;
    const key = r.equipment.id;
    if (!eqMap.has(key)) {
      eqMap.set(key, { name: r.equipment.name, pannes: 0, recent: 0, critical: 0, avgResolution: 0, resCount: 0 });
    }
    const eq = eqMap.get(key)!;
    eq.pannes++;

    // Recent = last 3 months
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (r.createdAt >= threeMonthsAgo) eq.recent++;

    if (r.urgency === "CRITICAL" || r.urgency === "URGENT") eq.critical++;
  }

  // Add resolution times
  for (const r of doneRequests) {
    if (!r.equipment) continue;
    const eq = eqMap.get(r.equipmentId ?? "");
    if (!eq) continue;
    const days = (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      eq.avgResolution = (eq.avgResolution * eq.resCount + days) / (eq.resCount + 1);
      eq.resCount++;
    }
  }

  // Calculate risk score (0-100)
  const riskData = Array.from(eqMap.values())
    .map((eq) => {
      const freqScore = Math.min(40, eq.pannes * 4); // up to 40 pts
      const recentScore = Math.min(30, eq.recent * 10); // up to 30 pts
      const criticalScore = Math.min(20, eq.critical * 5); // up to 20 pts
      const resolutionScore = Math.min(10, eq.avgResolution); // up to 10 pts
      const score = Math.round(Math.min(100, freqScore + recentScore + criticalScore + resolutionScore));
      return { name: eq.name, score, pannes: eq.pannes };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  /* ── Trend + Prediction (monthly, last 12 months + 3 predicted) ── */
  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCountsArr: number[] = [];
  const trendLabels: string[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const key = monthNames[d.getMonth()];
    trendLabels.push(key);
    const count = allRequests.filter(
      (r) => r.createdAt >= d && r.createdAt < nextMonth,
    ).length;
    monthlyCountsArr.push(count);
  }

  // Linear regression for prediction
  const { slope, intercept } = linearRegression(monthlyCountsArr);

  const trendData: { month: string; actual: number | null; predicted: number | null }[] = [];
  for (let i = 0; i < 12; i++) {
    trendData.push({ month: trendLabels[i], actual: monthlyCountsArr[i], predicted: null });
  }
  // Last actual point also starts prediction line
  trendData[11].predicted = monthlyCountsArr[11];
  // 3 months prediction
  for (let i = 1; i <= 3; i++) {
    const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const predicted = Math.max(0, Math.round(intercept + slope * (11 + i)));
    trendData.push({
      month: monthNames[futureMonth.getMonth()],
      actual: null,
      predicted,
    });
  }

  /* ── Resolution time by equipment ── */
  const resolutionByEq = Array.from(eqMap.values())
    .filter((eq) => eq.resCount > 0)
    .map((eq) => ({ name: eq.name, avgDays: Math.round(eq.avgResolution * 10) / 10 }))
    .sort((a, b) => b.avgDays - a.avgDays)
    .slice(0, 10);

  /* ── Seasonal heatmap (pannes par mois de l'annee) ── */
  const seasonalCounts = new Array(12).fill(0);
  for (const r of allRequests) {
    seasonalCounts[r.createdAt.getMonth()]++;
  }
  const seasonalData = monthNames.map((m, i) => ({ month: m, count: seasonalCounts[i] }));

  /* ── MTBF by month (last 12 months) ── */
  const mtbfData: { month: string; mtbf: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const daysInMonth = (nextMonth.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    const pannes = allRequests.filter(
      (r) => r.createdAt >= d && r.createdAt < nextMonth,
    ).length;
    const mtbfValue = pannes > 0 ? Math.round((allEquipments * daysInMonth) / pannes) : Math.round(allEquipments * daysInMonth);
    mtbfData.push({ month: monthNames[d.getMonth()], mtbf: Math.min(mtbfValue, 999) });
  }

  /* ── Alertes predictives ── */
  const alerts: { name: string; message: string; level: "critical" | "warning" | "info" }[] = [];
  for (const eq of riskData) {
    if (eq.score >= 70) {
      alerts.push({
        name: eq.name,
        message: `Score de risque ${eq.score}/100 — ${eq.pannes} pannes total. Remplacement ou maintenance lourde recommande.`,
        level: "critical",
      });
    } else if (eq.score >= 40) {
      alerts.push({
        name: eq.name,
        message: `Score de risque ${eq.score}/100 — Maintenance preventive recommandee.`,
        level: "warning",
      });
    }
  }

  // Trend alert
  if (slope > 0.5) {
    alerts.push({
      name: "Tendance globale",
      message: `Les pannes augmentent en moyenne de ${(slope).toFixed(1)} par mois. Verifiez les equipements ages.`,
      level: "warning",
    });
  }

  const alertStyles = {
    critical: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };
  const alertIcons = {
    critical: <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Zap className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Intelligente"
        description="Scoring de risque, predictions et indicateurs avances pour la maintenance predictive."
        actions={
          <Link href="/statistiques" className="secondary-button">
            Statistiques de base
          </Link>
        }
      />

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="MTTR"
          value={mttr > 0 ? `${mttr}j` : "N/A"}
          description="Temps moyen de reparation"
          icon={<Clock className="h-5 w-5" />}
          color="indigo"
        />
        <StatCard
          eyebrow="Taux resolution"
          value={`${resolutionRate}%`}
          description={`${resolvedCount}/${allRequests.length} demandes`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          eyebrow="Criticite"
          value={`${criticalRate}%`}
          description={`${criticalCount} urgentes/critiques`}
          icon={<Gauge className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          eyebrow="Disponibilite"
          value={`${availability}%`}
          description="Du parc equipements"
          icon={<Shield className="h-5 w-5" />}
          color={availability >= 80 ? "emerald" : "rose"}
        />
      </section>

      {/* Alertes predictives */}
      {alerts.length > 0 && (
        <section className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Alertes predictives</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${alertStyles[a.level]}`}>
                {alertIcons[a.level]}
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-sm mt-0.5">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risk scores + Trend */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-bold text-gray-900">Score de risque par equipement</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Base sur: frequence, pannes recentes, criticite, temps de resolution</p>
          <RiskScoreChart data={riskData} />
          <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600" />Critique (&ge;70)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-500" />Moyen (40-69)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-emerald-600" />Faible (&lt;40)</span>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Tendance & Prediction</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">12 derniers mois + 3 mois de prediction (regression lineaire)</p>
          <TrendPredictionChart data={trendData} />
          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-indigo-600" />Reel</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-500" />Prediction</span>
            {slope > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <TrendingUp className="h-3 w-3" /> +{slope.toFixed(1)}/mois
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingDown className="h-3 w-3" /> {slope.toFixed(1)}/mois
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Resolution time + Seasonal */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <h2 className="text-base font-bold text-gray-900">Temps moyen de resolution</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Par equipement (jours)</p>
          <ResolutionTimeChart data={resolutionByEq} />
        </div>

        <div className="panel p-6">
          <h2 className="text-base font-bold text-gray-900">Saisonnalite des pannes</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Repartition par mois (toutes les annees confondues)</p>
          <SeasonalChart data={seasonalData} />
        </div>
      </section>

      {/* MTBF */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-gray-900">MTBF — Temps moyen entre pannes</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">Evolution sur 12 mois (jours entre pannes par equipement)</p>
        <MtbfChart data={mtbfData} />
      </section>
    </div>
  );
}
