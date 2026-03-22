import Link from "next/link";
import { createAnomalyAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { requestIssueTypeOptions } from "@/lib/labels";

type AnomalyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportAnomalyPage({ searchParams }: AnomalyPageProps) {
  const qp = await searchParams;
  const error = typeof qp.error === "string" ? qp.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signaler une anomalie"
        description="Signalez un probleme visible (fissure, fuite, degradation...) sans que l'element soit enregistre comme equipement."
        actions={
          <Link href="/demandes" className="secondary-button">
            Retour a mes demandes
          </Link>
        }
      />

      <section className="panel p-6">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <form action={createAnomalyAction} className="grid gap-6">
          <div className="space-y-2">
            <label className="label" htmlFor="anomalyLabel">
              Ou se trouve le probleme ?
            </label>
            <input
              className="field"
              id="anomalyLabel"
              name="anomalyLabel"
              type="text"
              placeholder="Ex : Couloir Batiment A - RDC, Mur salle de pause, Plafond chambre 5..."
              required
            />
            <p className="helper">Decris l'endroit le plus precisement possible.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="label" htmlFor="building">
                Batiment
              </label>
              <input className="field" id="building" name="building" type="text" placeholder="Ex : Batiment principal" />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="floor">
                Etage
              </label>
              <input className="field" id="floor" name="floor" type="text" placeholder="Ex : RDC, 1er" />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="room">
                Piece / Zone
              </label>
              <input className="field" id="room" name="room" type="text" placeholder="Ex : Couloir, Chambre 12" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="label" htmlFor="issueType">
                Type de probleme
              </label>
              <select className="field" id="issueType" name="issueType" defaultValue="OTHER">
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
              Description de l&apos;anomalie
            </label>
            <textarea
              className="field min-h-40"
              id="description"
              name="description"
              placeholder="Decris ce que tu observes : fissure dans le mur, tache d'humidite au plafond, carrelage descelle... Depuis quand ?"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="photos">
              Photos de l&apos;anomalie
            </label>
            <input className="field" id="photos" name="photos" type="file" accept="image/*" multiple capture="environment" />
            <p className="helper">Prends une photo directement avec ton telephone pour aider au diagnostic.</p>
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
