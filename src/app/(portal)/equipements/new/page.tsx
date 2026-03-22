import { Role } from "@prisma/client";
import Link from "next/link";
import { createEquipmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { equipmentStatusOptions } from "@/lib/labels";
import { requireRole } from "@/lib/session";

type NewEquipmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewEquipmentPage({ searchParams }: NewEquipmentPageProps) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const categories = await prisma.equipmentCategory.findMany({
    where: { ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    orderBy: { name: "asc" },
  });
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel equipement"
        description="Ajoute un equipement, sa localisation et ses informations de garantie pour rendre le QR code disponible immediatement."
        actions={
          <Link href="/equipements" className="secondary-button">
            Retour a l&apos;inventaire
          </Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <form action={createEquipmentAction} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="label" htmlFor="name">
              Nom de l&apos;equipement <span className="text-rose-500">*</span>
            </label>
            <input className="field" id="name" name="name" placeholder="Lave-linge Buanderie 2" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="categoryId">
              Categorie
            </label>
            <select className="field" id="categoryId" name="categoryId" defaultValue="">
              <option value="">Selectionner une categorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="brand">
              Marque
            </label>
            <input className="field" id="brand" name="brand" placeholder="Miele" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="model">
              Modele
            </label>
            <input className="field" id="model" name="model" placeholder="W1" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="serialNumber">
              Numero de serie
            </label>
            <input className="field" id="serialNumber" name="serialNumber" placeholder="SER-123456" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="status">
              Statut initial <span className="text-rose-500">*</span>
            </label>
            <select className="field" id="status" name="status" defaultValue="IN_SERVICE">
              {equipmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="building">
              Batiment <span className="text-rose-500">*</span>
            </label>
            <input className="field" id="building" name="building" placeholder="Batiment pedagogique" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="floor">
              Etage
            </label>
            <input className="field" id="floor" name="floor" placeholder="RDC" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="room">
              Salle / zone
            </label>
            <input className="field" id="room" name="room" placeholder="Buanderie" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="supplier">
              Fournisseur
            </label>
            <input className="field" id="supplier" name="supplier" placeholder="Equip'Service" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="purchaseDate">
              Date d&apos;achat
            </label>
            <input className="field" id="purchaseDate" name="purchaseDate" type="date" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="commissioningDate">
              Mise en service
            </label>
            <input className="field" id="commissioningDate" name="commissioningDate" type="date" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="warrantyEndDate">
              Fin de garantie
            </label>
            <input className="field" id="warrantyEndDate" name="warrantyEndDate" type="date" />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="label" htmlFor="photos">
              Photos
            </label>
            <input className="field" id="photos" name="photos" type="file" accept="image/*" multiple />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea className="field min-h-36" id="notes" name="notes" placeholder="Informations utiles sur l'utilisation, le contrat ou les recommandations." />
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button className="primary-button" type="submit">
              Creer l&apos;equipement
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
