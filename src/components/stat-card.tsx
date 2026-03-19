import { ReactNode } from "react";

type StatCardProps = {
  eyebrow: string;
  value: string;
  description: string;
  icon?: ReactNode;
  color?: "default" | "indigo" | "amber" | "emerald" | "rose";
};

const colorMap = {
  default: "bg-gray-100 text-gray-600",
  indigo: "bg-indigo-100 text-indigo-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  rose: "bg-rose-100 text-rose-600",
};

export function StatCard({ eyebrow, value, description, icon, color = "default" }: StatCardProps) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{eyebrow}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        {icon ? <div className={`rounded-xl p-2.5 ${colorMap[color]}`}>{icon}</div> : null}
      </div>
    </div>
  );
}
