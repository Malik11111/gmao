"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTaskAction } from "@/app/actions";

type Props = {
  technicians: { id: string; firstName: string; lastName: string }[];
  weekMonday: string;
  weekDays: { date: string; label: string }[];
};

export function CreateTaskForm({ technicians, weekMonday, weekDays }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="primary-button text-xs gap-1.5 px-3 py-1.5">
        <Plus className="h-3.5 w-3.5" /> Nouvelle tache
      </button>
    );
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">Nouvelle tache</h3>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      <form action={createTaskAction} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <input type="hidden" name="week" value={weekMonday} />
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Titre</label>
          <input name="title" className="field text-xs py-1.5" placeholder="Ex: Ronde bat. A" required />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Type</label>
          <select name="type" className="field text-xs py-1.5" required>
            <option value="RONDE">Ronde</option>
            <option value="PREVENTIF">Preventif</option>
            <option value="TACHE_LIBRE">Tache libre</option>
            <option value="ACCOMPAGNEMENT_EXTERNE">Accomp. externe</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Technicien</label>
          <select name="assignedToId" className="field text-xs py-1.5" required>
            <option value="">Choisir...</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Jour</label>
            <select name="date" className="field text-xs py-1.5" required>
              {weekDays.map((d) => (
                <option key={d.date} value={d.date}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Creneau</label>
            <select name="timeSlot" className="field text-xs py-1.5" required>
              <option value="MATIN">Matin</option>
              <option value="APRES_MIDI">Apres-midi</option>
            </select>
          </div>
        </div>
        <div className="col-span-2 lg:col-span-3">
          <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Description (optionnel)</label>
          <input name="description" className="field text-xs py-1.5" placeholder="Details..." />
        </div>
        <div className="flex items-end">
          <button type="submit" className="primary-button text-xs w-full justify-center py-1.5">Creer</button>
        </div>
      </form>
    </div>
  );
}
