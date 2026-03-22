import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateUserAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const roleOptions = [
  { value: "USER", label: "Personnel" },
  { value: "TECHNICIAN", label: "Technicien" },
  { value: "MANAGER", label: "Responsable technique" },
  { value: "ADMIN", label: "Administrateur" },
];

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  await requireRole([Role.SUPER_ADMIN, Role.ADMIN]);
  const { id } = await params;
  const qp = await searchParams;
  const error = typeof qp.error === "string" ? qp.error : undefined;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifier ${user.firstName} ${user.lastName}`}
        description="Mettre a jour les informations du compte."
        actions={
          <Link href="/admin/utilisateurs" className="secondary-button">Retour a la liste</Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form action={updateUserAction} className="grid gap-6 lg:grid-cols-2">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-1.5">
            <label className="label" htmlFor="firstName">Prenom</label>
            <input className="field" id="firstName" name="firstName" defaultValue={user.firstName} required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="lastName">Nom</label>
            <input className="field" id="lastName" name="lastName" defaultValue={user.lastName} required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="email">Adresse email</label>
            <input className="field" id="email" name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="password">Nouveau mot de passe</label>
            <input className="field" id="password" name="password" type="password" placeholder="Laisser vide pour ne pas changer" />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="role">Role</label>
            <select className="field" id="role" name="role" defaultValue={user.role}>
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="service">Service</label>
            <input className="field" id="service" name="service" defaultValue={user.service ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="phone">Telephone</label>
            <input className="field" id="phone" name="phone" defaultValue={user.phone ?? ""} />
          </div>
          <div className="lg:col-span-2 flex justify-end gap-3">
            <Link href="/admin/utilisateurs" className="secondary-button">Annuler</Link>
            <button className="primary-button" type="submit">Enregistrer</button>
          </div>
        </form>
      </section>
    </div>
  );
}
