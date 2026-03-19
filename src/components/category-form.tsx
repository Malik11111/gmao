"use client";

import { useState } from "react";

type Technician = { id: string; firstName: string; lastName: string };

type CategoryFormProps = {
  action: (formData: FormData) => void;
  technicians: Technician[];
  defaultValues?: {
    id: string;
    name: string;
    icon: string;
    isExternal: boolean;
    contractorName: string;
    contractorPhone: string;
    contractorEmail: string;
    specialistIds: string[];
  };
};

export function CategoryForm({ action, technicians, defaultValues }: CategoryFormProps) {
  const [isExternal, setIsExternal] = useState(defaultValues?.isExternal ?? false);

  return (
    <form action={action} className="space-y-6">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-1.5">
          <label className="label" htmlFor="name">Nom de la categorie <span className="text-red-500">*</span></label>
          <input className="field" id="name" name="name" placeholder="Ex: Plomberie" defaultValue={defaultValues?.name} required />
        </div>
        <div className="space-y-1.5">
          <label className="label" htmlFor="icon">Icone (optionnel)</label>
          <input className="field" id="icon" name="icon" placeholder="Ex: droplets, zap, monitor" defaultValue={defaultValues?.icon} />
        </div>
      </div>

      <div className="space-y-3">
        <label className="label">Type de maintenance</label>
        <div className="flex gap-4">
          <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition ${!isExternal ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
            <input
              type="radio"
              name="isExternal"
              value="false"
              checked={!isExternal}
              onChange={() => setIsExternal(false)}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-slate-900">Interne</p>
            <p className="text-xs text-slate-500 mt-1">Technicien de l&apos;etablissement</p>
          </label>
          <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition ${isExternal ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"}`}>
            <input
              type="radio"
              name="isExternal"
              value="true"
              checked={isExternal}
              onChange={() => setIsExternal(true)}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-slate-900">Externe</p>
            <p className="text-xs text-slate-500 mt-1">Prestataire / sous-traitant</p>
          </label>
        </div>
      </div>

      {isExternal ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
          <p className="text-sm font-semibold text-amber-800">Coordonnees du prestataire</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="label" htmlFor="contractorName">Nom du prestataire</label>
              <input className="field" id="contractorName" name="contractorName" placeholder="Ex: Otis France" defaultValue={defaultValues?.contractorName} />
            </div>
            <div className="space-y-1.5">
              <label className="label" htmlFor="contractorPhone">Telephone</label>
              <input className="field" id="contractorPhone" name="contractorPhone" placeholder="01 XX XX XX XX" defaultValue={defaultValues?.contractorPhone} />
            </div>
            <div className="space-y-1.5">
              <label className="label" htmlFor="contractorEmail">Email</label>
              <input className="field" id="contractorEmail" name="contractorEmail" type="email" placeholder="contact@prestataire.fr" defaultValue={defaultValues?.contractorEmail} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3">
          <p className="text-sm font-semibold text-indigo-800">Technicien(s) specialise(s)</p>
          <p className="text-xs text-indigo-600">Les demandes sur cette categorie seront automatiquement assignees au technicien selectionne.</p>
          {technicians.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {technicians.map((tech) => (
                <label key={tech.id} className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white p-3 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="checkbox"
                    name="specialistIds"
                    value={tech.id}
                    defaultChecked={defaultValues?.specialistIds?.includes(tech.id)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-900">{tech.firstName} {tech.lastName}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Aucun technicien actif. Creez d&apos;abord un utilisateur avec le role Technicien.</p>
          )}
        </div>
      )}

      <button type="submit" className="primary-button">
        {defaultValues ? "Enregistrer les modifications" : "Creer la categorie"}
      </button>
    </form>
  );
}
