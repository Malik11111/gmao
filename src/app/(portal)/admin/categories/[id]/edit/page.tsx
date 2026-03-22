import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { updateCategoryAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { CategoryForm } from "@/components/category-form";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCategoryPage({ params, searchParams }: Props) {
  const user = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]);
  const { id } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const [category, technicians] = await Promise.all([
    prisma.equipmentCategory.findFirst({
      where: { id, ...estFilter },
      include: { specialists: { select: { id: true } } },
    }),
    prisma.user.findMany({
      where: { role: "TECHNICIAN", active: true, ...estFilter },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifier : ${category.name}`}
        description="Modifiez les informations de la categorie."
        actions={<Link href="/admin/categories" className="secondary-button">Retour</Link>}
      />
      <section className="panel p-6">
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <CategoryForm
          action={updateCategoryAction}
          technicians={technicians}
          defaultValues={{
            id: category.id,
            name: category.name,
            icon: category.icon ?? "",
            isExternal: category.isExternal,
            contractorName: category.contractorName ?? "",
            contractorPhone: category.contractorPhone ?? "",
            contractorEmail: category.contractorEmail ?? "",
            specialistIds: category.specialists.map((s) => s.id),
          }}
        />
      </section>
    </div>
  );
}
