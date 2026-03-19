"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type KanbanRequest = {
  id: string;
  number: string;
  equipmentName: string;
  urgency: string;
  assignee: string | null;
  assigneeName: string;
};

type KanbanColumn = {
  status: string;
  label: string;
  color: string;
  requests: KanbanRequest[];
};

const URGENCY_STYLES: Record<string, string> = {
  NORMAL: "bg-gray-100 text-gray-600",
  URGENT: "bg-amber-50 text-amber-700",
  CRITICAL: "bg-red-50 text-red-700",
};

const URGENCY_LABELS: Record<string, string> = {
  NORMAL: "Normale",
  URGENT: "Urgente",
  CRITICAL: "Critique",
};

export function KanbanBoard({ columns: initialColumns }: { columns: KanbanColumn[] }) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  function handleDragStart(requestId: string) {
    setDragging(requestId);
  }

  function handleDragOver(e: React.DragEvent, status: string) {
    e.preventDefault();
    setDragOver(status);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  async function handleDrop(targetStatus: string) {
    setDragOver(null);
    if (!dragging) return;

    // Find the card and its source column
    let sourceStatus = "";
    let card: KanbanRequest | undefined;
    for (const col of columns) {
      const found = col.requests.find((r) => r.id === dragging);
      if (found) {
        sourceStatus = col.status;
        card = found;
        break;
      }
    }

    if (!card || sourceStatus === targetStatus) {
      setDragging(null);
      return;
    }

    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.status === sourceStatus) {
          return { ...col, requests: col.requests.filter((r) => r.id !== dragging) };
        }
        if (col.status === targetStatus) {
          return { ...col, requests: [card!, ...col.requests] };
        }
        return col;
      }),
    );

    setDragging(null);
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.set("requestId", card.id);
      formData.set("status", targetStatus);

      await fetch("/api/kanban-update", {
        method: "POST",
        body: formData,
      });

      router.refresh();
    } catch {
      // Revert on error
      setColumns(initialColumns);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      {updating ? (
        <div className="absolute top-0 right-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white z-10">
          Mise a jour...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.status)}
            className={`rounded-xl border-2 transition-colors min-h-[300px] ${
              dragOver === col.status ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-bold text-gray-800">{col.label}</span>
              </div>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                {col.requests.length}
              </span>
            </div>

            <div className="p-2 space-y-2">
              {col.requests.map((req) => (
                <div
                  key={req.id}
                  draggable
                  onDragStart={() => handleDragStart(req.id)}
                  className={`rounded-lg border bg-white p-3 cursor-grab active:cursor-grabbing transition shadow-sm hover:shadow-md ${
                    dragging === req.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400">{req.number}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${URGENCY_STYLES[req.urgency] ?? ""}`}>
                      {URGENCY_LABELS[req.urgency] ?? req.urgency}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{req.equipmentName}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {req.assignee ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-[9px] font-bold text-indigo-700" title={req.assigneeName}>
                        {req.assignee}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">Non assigne</span>
                    )}
                  </div>
                </div>
              ))}

              {col.requests.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8">Deposez ici</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
