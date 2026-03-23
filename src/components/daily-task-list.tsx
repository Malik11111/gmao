"use client";

import Link from "next/link";
import { updateTaskStatusAction } from "@/app/actions";

export type DailyItem = {
  id: string;
  label: string;
  description?: string;
  sourceType: "task" | "request";
  colorClass: string;
  typeBadge: string;
  timeSlot: "MATIN" | "APRES_MIDI";
  status: string;
  requestLink?: string;
};

export function DailyTaskList({ items }: { items: DailyItem[] }) {
  const matin = items.filter((i) => i.timeSlot === "MATIN");
  const am = items.filter((i) => i.timeSlot === "APRES_MIDI");

  const renderItem = (item: DailyItem) => (
    <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 bg-white ${item.status === "FAIT" ? "opacity-50" : ""}`}>
      <div className={`w-1 h-10 rounded-full shrink-0 ${item.colorClass.replace("text-", "bg-").split(" ")[0]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
          <span className={`text-[10px] rounded px-1.5 py-0.5 font-bold ${item.colorClass}`}>{item.typeBadge}</span>
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {item.sourceType === "request" && item.requestLink && (
          <Link href={item.requestLink} className="secondary-button text-[10px] px-2 py-1">Voir</Link>
        )}
        {item.sourceType === "task" && item.status !== "FAIT" && (
          <form action={updateTaskStatusAction}>
            <input type="hidden" name="taskId" value={item.id} />
            <input type="hidden" name="status" value="FAIT" />
            <button type="submit" className="rounded-lg bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 hover:bg-emerald-600 transition">
              Terminer
            </button>
          </form>
        )}
        {item.status === "FAIT" && (
          <span className="text-[10px] text-emerald-600 font-bold">Fait</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Matin</h3>
        {matin.length === 0 && <p className="text-xs text-gray-400 ml-2">Rien de prevu</p>}
        <div className="space-y-2">{matin.map(renderItem)}</div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Apres-midi</h3>
        {am.length === 0 && <p className="text-xs text-gray-400 ml-2">Rien de prevu</p>}
        <div className="space-y-2">{am.map(renderItem)}</div>
      </div>
    </div>
  );
}
