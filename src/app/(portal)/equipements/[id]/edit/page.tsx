import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEquipmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { equipmentStatusOptions } from "@/lib/labels";
import { requireRole } from "@/lib/session";

type EditEquipmentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditEquipmentPage({ params, searchParams }: EditEquipmentPageProps) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const { id } = await params;
  const qp = await searchParams;
  const error = typeof qp.error === "string" ? qp.error : undefined;
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const [equipment, categories] = await Promise.all([
    prisma.equipment.findFirst({
      where: { id, ...estFilter },
      include: { location: true },
    }),
    prisma.equipmentCategory.findMany({ where: { ...estFilter }, orderBy: { name: "asc" } }),
  ]);

  if (!equipment) {
    notFound();
  }

  function toDateInput(d?: Date | null) {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifier ${equipment.name}`}
        description={`Mise a jour de la fiche equipement ${equipment.code}.`}
        actions={
          <Link href={`/equipements/${equipment.id}`} className="secondary-button">
            Retour a la fiche
          </Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <form action={updateEquipmentAction} className="mt-6 grid gap-6 lg:grid-cols-2">
          <input type="hidden" name="id" value={equipment.id} />

          <div className="space-y-2">
            <label className="label" htmlFor="name">Nom de l&apos;equipement</label>
            <input className="field" id="name" name="name" defaultValue={equipment.name} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="categoryId">Categorie</label>
            <select className="field" id="categoryId" name="categoryId" defaultValue={equipment.categoryId ?? ""}>
              <option value="">Selectionner une categorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="brand">Marque</label>
            <input className="field" id="brand" name="brand" defaultValue={equipment.brand ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="model">Modele</label>
            <input className="field" id="model" name="model" defaultValue={equipment.model ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="serialNumber">Numero de serie</label>
            <input className="field" id="serialNumber" name="serialNumber" defaultValue={equipment.serialNumber ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="status">Statut</label>
            <select className="field" id="status" name="status" defaultValue={equipment.status}>
              {equipmentStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="building">Batiment</label>
            <input className="field" id="building" name="building" defaultValue={equipment.location?.building ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="floor">Etage</label>
            <input className="field" id="floor" name="floor" defaultValue={equipment.location?.floor ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="room">Salle / zone</label>
            <input className="field" id="room" name="room" defaultValue={equipment.location?.room ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="supplier">Fournisseur</label>
            <input className="field" id="supplier" name="supplier" defaultValue={equipment.supplier ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="purchaseDate">Date d&apos;achat</label>
            <input className="field" id="purchaseDate" name="purchaseDate" type="date" defaultValue={toDateInput(equipment.purchaseDate)} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="commissioningDate">Mise en service</label>
            <input className="field" id="commissioningDate" name="commissioningDate" type="date" defaultValue={toDateInput(equipment.commissioningDate)} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="warrantyEndDate">Fin de garantie</label>
            <input className="field" id="warrantyEndDate" name="warrantyEndDate" type="date" defaultValue={toDateInput(equipment.warrantyEndDate)} />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="label" htmlFor="photos">Ajouter des photos</label>
            <input className="field" id="photos" name="photos" type="file" accept="image/*" multiple />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="label" htmlFor="notes">Notes</label>
            <textarea className="field min-h-36" id="notes" name="notes" defaultValue={equipment.notes ?? ""} />
          </div>

          <div className="lg:col-span-2 flex justify-end gap-3">
            <Link href={`/equipements/${equipment.id}`} className="secondary-button">Annuler</Link>
            <button className="primary-button" type="submit">Enregistrer les modifications</button>
          </div>
        </form>
      </section>
    </div>
  );
}
