import { Role } from "@prisma/client";
import Link from "next/link";
import { createEstablishmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/session";

export default async function NewEstablishmentPage() {
  await requireRole([Role.SUPER_ADMIN]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel etablissement"
        description="Creez un etablissement et son compte administrateur."
        actions={
          <Link href="/admin/etablissements" className="secondary-button">Retour a la liste</Link>
        }
      />

      <section className="panel p-6">
        <form action={createEstablishmentAction} className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Informations de l&apos;etablissement</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-1.5">
                <label className="label" htmlFor="name">Nom</label>
                <input className="field" id="name" name="name" placeholder="Hopital Saint-Louis" required />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="slug">Identifiant (slug)</label>
                <input className="field" id="slug" name="slug" placeholder="hopital-saint-louis" required />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="address">Adresse</label>
                <input className="field" id="address" name="address" placeholder="1 avenue Claude Vellefaux, 75010 Paris" />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="phone">Telephone</label>
                <input className="field" id="phone" name="phone" placeholder="01 42 49 49 49" />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="email">Email de contact</label>
                <input className="field" id="email" name="email" type="email" placeholder="contact@hopital.fr" />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Compte administrateur (optionnel)</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-1.5">
                <label className="label" htmlFor="adminFirstName">Prenom</label>
                <input className="field" id="adminFirstName" name="adminFirstName" placeholder="Philippe" />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="adminLastName">Nom</label>
                <input className="field" id="adminLastName" name="adminLastName" placeholder="Dupont" />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="adminEmail">Email</label>
                <input className="field" id="adminEmail" name="adminEmail" type="email" placeholder="admin@hopital.fr" />
              </div>
              <div className="space-y-1.5">
                <label className="label" htmlFor="adminPassword">Mot de passe</label>
                <input className="field" id="adminPassword" name="adminPassword" type="password" placeholder="Minimum 6 caracteres" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="primary-button" type="submit">Creer l&apos;etablissement</button>
          </div>
        </form>
      </section>
    </div>
  );
}
