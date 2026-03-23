"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PlanningItem = {
  id: string;
  label: string;
  sourceType: "task" | "request";
  colorClass: string;
  urgency?: string;
  status?: string;
};

type CellData = { matin: PlanningItem[]; apresMidi: PlanningItem[] };

type Props = {
  technicians: { id: string; firstName: string; lastName: string }[];
  days: string[];
  dayLabels: string[];
  items: Record<string, Record<string, CellData>>;
};

export function PlanningGrid({ technicians, days, dayLabels, items }: Props) {
  const router = useRouter();
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = async (techId: string, day: string, slot: "MATIN" | "APRES_MIDI", e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const raw = e.dataTransfer.getData("text/plain");
      const data = JSON.parse(raw) as { type: string; id: string };
      const fd = new FormData();
      fd.set("type", data.type);
      fd.set("id", data.id);
      fd.set("technicianId", techId);
      fd.set("date", day);
      fd.set("timeSlot", slot);
      await fetch("/api/planning-update", { method: "POST", body: fd });
      router.refresh();
    } catch { /* ignore */ }
  };

  const handleDragStart = (item: PlanningItem, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: item.sourceType, id: item.id }));
  };

  const cellKey = (techId: string, day: string, slot: string) => `${techId}-${day}-${slot}`;

  const renderCell = (techId: string, day: string, slot: "MATIN" | "APRES_MIDI") => {
    const key = cellKey(techId, day, slot);
    const cellItems = items[techId]?.[day]?.[slot === "MATIN" ? "matin" : "apresMidi"] ?? [];
    const isOver = dragOver === key;

    return (
      <td
        key={key}
        className={`border border-gray-100 p-0.5 align-top min-w-[72px] h-12 transition-colors ${isOver ? "bg-indigo-50 border-indigo-300" : "bg-white"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleDrop(techId, day, slot, e)}
      >
        <div className="flex flex-col gap-0.5">
          {cellItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(item, e)}
              className={`text-[10px] leading-tight rounded px-1 py-0.5 truncate cursor-grab ${item.colorClass}`}
              title={item.label}
            >
              {item.label}
            </div>
          ))}
        </div>
      </td>
    );
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2 pb-2">
      <table className="w-full border-collapse text-xs min-w-[600px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-100 p-1 text-left font-semibold text-gray-600 w-28 sticky left-0 bg-gray-50 z-10">Technicien</th>
            {days.map((day, i) => (
              <th key={day} colSpan={2} className="border border-gray-100 p-1 text-center font-semibold text-gray-600">
                {dayLabels[i]}
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50/60">
            <th className="border border-gray-100 p-0.5 sticky left-0 bg-gray-50/60 z-10" />
            {days.map((day) => (
              <>
                <th key={`${day}-m`} className="border border-gray-100 p-0.5 text-center text-[10px] text-gray-400 font-normal w-[72px]">M</th>
                <th key={`${day}-am`} className="border border-gray-100 p-0.5 text-center text-[10px] text-gray-400 font-normal w-[72px]">AM</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {technicians.map((tech) => (
            <tr key={tech.id}>
              <td className="border border-gray-100 p-1 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10">
                {tech.firstName} {tech.lastName[0]}.
              </td>
              {days.map((day) => (
                <>
                  {renderCell(tech.id, day, "MATIN")}
                  {renderCell(tech.id, day, "APRES_MIDI")}
                </>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
