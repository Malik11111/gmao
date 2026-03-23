"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ── Risk Score (horizontal bar) ── */

type RiskItem = { name: string; score: number; pannes: number };

export function RiskScoreChart({ data }: { data: RiskItem[] }) {
  const getColor = (score: number) =>
    score >= 70 ? "#dc2626" : score >= 40 ? "#d97706" : "#059669";

  return (
    <div style={{ height: Math.max(200, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 5 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={160} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            formatter={(value: number, _name: string, props: any) => [`${value}/100 (${props.payload.pannes} pannes)`, "Score de risque"]}
          />
          <Bar dataKey="score" name="Risque" radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Trend + Prediction (line chart) ── */

type TrendItem = { month: string; actual: number | null; predicted: number | null };

export function TrendPredictionChart({ data }: { data: TrendItem[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            formatter={(value: number | null, name: string) => [value ?? "—", name === "actual" ? "Reel" : "Prediction"]}
          />
          <Area type="monotone" dataKey="actual" name="actual" stroke="#4f46e5" strokeWidth={2.5} fill="url(#gradActual)" dot={{ r: 4, fill: "#4f46e5" }} connectNulls={false} />
          <Area type="monotone" dataKey="predicted" name="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" fill="url(#gradPredicted)" dot={{ r: 3, fill: "#f59e0b", strokeDasharray: "0" }} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Resolution time by equipment ── */

type ResolutionItem = { name: string; avgDays: number };

export function ResolutionTimeChart({ data }: { data: ResolutionItem[] }) {
  return (
    <div style={{ height: Math.max(200, data.length * 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={160} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            formatter={(value: number) => [`${value} jours`, "Temps moyen"]}
          />
          <Bar dataKey="avgDays" name="Jours" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Monthly heatmap (seasonal patterns) ── */

type HeatmapItem = { month: string; count: number };

export function SeasonalChart({ data }: { data: HeatmapItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const getOpacity = (count: number) => 0.15 + (count / max) * 0.85;

  return (
    <div className="grid grid-cols-6 gap-2">
      {data.map((d) => (
        <div key={d.month} className="text-center">
          <div
            className="rounded-lg h-14 flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: `rgba(79, 70, 229, ${getOpacity(d.count)})`,
              color: d.count / max > 0.5 ? "white" : "#4f46e5",
            }}
          >
            {d.count}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{d.month}</p>
        </div>
      ))}
    </div>
  );
}

/* ── MTBF evolution ── */

type MtbfItem = { month: string; mtbf: number };

export function MtbfChart({ data }: { data: MtbfItem[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="j" />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            formatter={(value: number) => [`${value} jours`, "MTBF"]}
          />
          <Line type="monotone" dataKey="mtbf" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: "#059669" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
