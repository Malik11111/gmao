import Link from "next/link";
import { notFound } from "next/navigation";
import { createRequestAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requestIssueTypeOptions } from "@/lib/labels";
import { formatLocation } from "@/lib/utils";

type ReportIssuePageProps = {
  params: Promise<{ equipmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportIssuePage({ params, searchParams }: ReportIssuePageProps) {
  const { equipmentId } = await params;
  const qp = await searchParams;
  const error = typeof qp.error === "string" ? qp.error : undefined;

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: { location: true },
  });

  if (!equipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signaler un probleme"
        description="Formulaire simplifie pour declencher une demande d'intervention a partir de la fiche equipement."
        actions={
          <Link href={`/equipements/${equipment.id}`} className="secondary-button">
            Retour a la fiche
          </Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white/85 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Equipement</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{equipment.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Localisation</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatLocation(equipment.location)}</p>
          </div>
        </div>

        <form action={createRequestAction} className="mt-6 grid gap-6">
          <input type="hidden" name="equipmentId" value={equipment.id} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="label" htmlFor="issueType">
                Type de probleme
              </label>
              <select className="field" id="issueType" name="issueType" defaultValue="COMPLETE_FAILURE">
                {requestIssueTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label" htmlFor="urgency">
                Niveau d&apos;urgence
              </label>
              <select className="field" id="urgency" name="urgency" defaultValue="NORMAL">
                <option value="NORMAL">Normale</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              className="field min-h-40"
              id="description"
              name="description"
              placeholder="Decris le symptome observe, l'impact et depuis quand le probleme est apparu."
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="photos">
              Photos du probleme
            </label>
            <input className="field" id="photos" name="photos" type="file" accept="image/*" multiple />
            <p className="helper">Tu peux ajouter plusieurs photos pour aider au diagnostic.</p>
          </div>

          <div className="flex justify-end">
            <button className="primary-button" type="submit">
              Envoyer le signalement
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
