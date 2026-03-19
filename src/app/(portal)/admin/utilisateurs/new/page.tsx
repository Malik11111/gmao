import { Role } from "@prisma/client";
import Link from "next/link";
import { createUserAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/session";

type NewUserPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const roleOptions = [
  { value: "USER", label: "Personnel" },
  { value: "TECHNICIAN", label: "Technicien" },
  { value: "MANAGER", label: "Responsable technique" },
  { value: "ADMIN", label: "Administrateur" },
];

export default async function NewUserPage({ searchParams }: NewUserPageProps) {
  await requireRole([Role.ADMIN]);
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvel utilisateur"
        description="Creer un compte pour un membre du personnel."
        actions={
          <Link href="/admin/utilisateurs" className="secondary-button">Retour a la liste</Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form action={createUserAction} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label" htmlFor="firstName">Prenom</label>
            <input className="field" id="firstName" name="firstName" placeholder="Julie" required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="lastName">Nom</label>
            <input className="field" id="lastName" name="lastName" placeholder="Martin" required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="email">Adresse email</label>
            <input className="field" id="email" name="email" type="email" placeholder="julie.martin@exemple.fr" required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="password">Mot de passe</label>
            <input className="field" id="password" name="password" type="password" placeholder="Minimum 6 caracteres" required />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="role">Role</label>
            <select className="field" id="role" name="role" defaultValue="USER">
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="service">Service</label>
            <input className="field" id="service" name="service" placeholder="Maintenance, Hebergement, Direction..." />
          </div>
          <div className="space-y-1.5">
            <label className="label" htmlFor="phone">Telephone</label>
            <input className="field" id="phone" name="phone" placeholder="01 40 00 00 00" />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button className="primary-button" type="submit">Creer l&apos;utilisateur</button>
          </div>
        </form>
      </section>
    </div>
  );
}
