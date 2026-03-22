import Link from "next/link";
import { Role } from "@prisma/client";
import { createCategoryAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { CategoryForm } from "@/components/category-form";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCategoryPage({ searchParams }: Props) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN", active: true, ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle categorie"
        description="Ajoutez une categorie d'equipements."
        actions={<Link href="/admin/categories" className="secondary-button">Retour</Link>}
      />
      <section className="panel p-6">
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <CategoryForm action={createCategoryAction} technicians={technicians} />
      </section>
    </div>
  );
}
