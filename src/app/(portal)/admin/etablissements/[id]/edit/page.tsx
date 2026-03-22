import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEstablishmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

type EditEstablishmentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEstablishmentPage({ params }: EditEstablishmentPageProps) {
  await requireRole([Role.SUPER_ADMIN]);
  const { id } = await params;

  const establishment = await prisma.establishment.findUnique({ where: { id } });
  if (!establishment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier l&apos;etablissement"
        description={establishment.name}
        actions={
          <Link href="/admin/etablissements" className="secondary-button">Retour a la liste</Link>
        }
      />

      <section className="panel p-6">
        <form action={updateEstablishmentAction} className="grid gap-6 lg:grid-cols-2">
          <input type="hidden" name="establishmentId" value={establishment.id} />
          <div className="space-y-1.5">
            <label className="label" htmlFor="name">Nom</label>
            <input className="field" id="name" name="name" defaultValue={establishment.name} required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="slug">Identifiant (slug)</label>
            <input className="field" id="slug" name="slug" defaultValue={establishment.slug} required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="address">Adresse</label>
            <input className="field" id="address" name="address" defaultValue={establishment.address ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="phone">Telephone</label>
            <input className="field" id="phone" name="phone" defaultValue={establishment.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="email">Email</label>
            <input className="field" id="email" name="email" type="email" defaultValue={establishment.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="active">Statut</label>
            <select className="field" id="active" name="active" defaultValue={String(establishment.active)}>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button className="primary-button" type="submit">Enregistrer</button>
          </div>
        </form>
      </section>
    </div>
  );
}
