"use client";

type SidebarRequest = {
  id: string;
  number: string;
  equipmentName: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  categoryName: string;
  isExternal: boolean;
};

const urgencyColors = {
  CRITICAL: "bg-red-200 text-red-800 border-red-300",
  URGENT: "bg-orange-100 text-orange-700 border-orange-200",
  NORMAL: "bg-gray-100 text-gray-600 border-gray-200",
};

const urgencyLabels = { CRITICAL: "Critique", URGENT: "Urgente", NORMAL: "Normale" };

export function PlanningSidebar({ requests }: { requests: SidebarRequest[] }) {
  const sorted = [...requests].sort((a, b) => {
    const order = { CRITICAL: 0, URGENT: 1, NORMAL: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  const handleDragStart = (req: SidebarRequest, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "request", id: req.id }));
  };

  return (
    <div className="w-full lg:w-56 shrink-0">
      <div className="panel p-3 lg:sticky lg:top-20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-700">En attente</h3>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 font-bold">{requests.length}</span>
        </div>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {sorted.length === 0 && <p className="text-[10px] text-gray-400">Aucune demande</p>}
          {sorted.map((req) => (
            <div
              key={req.id}
              draggable
              onDragStart={(e) => handleDragStart(req, e)}
              className="rounded-lg border border-gray-200 bg-white p-2 cursor-grab hover:shadow-sm transition text-[11px]"
            >
              <p className="font-semibold text-gray-800 truncate">{req.equipmentName || "Anomalie"}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${urgencyColors[req.urgency]}`}>
                  {urgencyLabels[req.urgency]}
                </span>
                {req.isExternal && (
                  <span className="rounded px-1 py-0.5 text-[9px] font-bold bg-yellow-100 text-yellow-700">Ext.</span>
                )}
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5">{req.number} · {req.categoryName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
