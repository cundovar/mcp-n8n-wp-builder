import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function DiscoveryBriefView({ artifact, showRaw = true }) {
  // Les artefacts ne sont pas homogenes aujourd'hui:
  // certains exposent directement les champs metier dans `artifact.payload`,
  // d'autres les encapsulent dans `artifact.payload.payload`.
  const payload = artifact?.payload?.payload || artifact?.payload || {};

  // On normalise ici les donnees pour que le rendu ne plante pas si le backend
  // renvoie une string simple (`objective`) au lieu d'un tableau `objectives`.
  const objectives = Array.isArray(payload.objectives)
    ? payload.objectives
    : payload.objective
      ? [{ description: payload.objective, priority: '-' }]
      : [];

  // L'ancien format expose `constraints`, le format observe dans les captures
  // expose plutot des listes deja a plat.
  const technical = toArray(payload.constraints?.technical);
  const business = toArray(payload.constraints?.business);
  const missingInformation = toArray(payload.missing_information);
  const risks = toArray(payload.risk_flags);
  const requestedFeatures = toArray(payload.features_requested);
  const requestedPages = toArray(payload.pages_requested);
  const rawBrief = payload.raw_brief || {};

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Objectifs', value: objectives.length },
          { label: 'Fonctionnalites', value: requestedFeatures.length || technical.length },
          { label: 'Pages demandees', value: requestedPages.length },
          { label: 'Risques', value: risks.length || missingInformation.length },
        ]}
      />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Objectifs</h4>
        <div className="space-y-2">
          {objectives.length === 0 && <p className="text-sm text-gray-500">Aucun objectif.</p>}
          {objectives.map((objective, index) => (
            <div key={index} className="rounded border border-gray-100 dark:border-gray-700 p-3">
              <p className="text-sm font-medium">
                {objective.description || objective.objective || objective.title || '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Priorite : {objective.priority || '-'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Brief normalise</h4>
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Nom du site</p>
              <p className="font-medium">{payload.site_name || rawBrief.site_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Type de site</p>
              <p className="font-medium">{payload.site_type || rawBrief.site_type || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Audience cible</p>
              <p className="font-medium">{payload.target_audience || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Domaine</p>
              <p className="font-medium">{payload.business_domain || '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Contraintes et demandes</h4>
          <p className="text-sm font-medium mb-2">Fonctionnalites</p>
          <ul className="list-disc list-inside text-sm space-y-1 mb-3">
            {(requestedFeatures.length > 0 ? requestedFeatures : technical).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
            {requestedFeatures.length === 0 && technical.length === 0 && <li>Aucune.</li>}
          </ul>

          <p className="text-sm font-medium mb-2">Pages demandees</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(requestedPages.length > 0 ? requestedPages : business).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
            {requestedPages.length === 0 && business.length === 0 && <li>Aucune.</li>}
          </ul>

          {payload.constraints?.timeline && (
            <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">
              Timeline : {payload.constraints.timeline}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Informations manquantes</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {missingInformation.length === 0 && <li>Aucune.</li>}
            {missingInformation.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Risques</h4>
        <div className="space-y-2">
          {risks.length === 0 && <p className="text-sm text-gray-500">Aucun risque identifie.</p>}
          {risks.map((risk, index) => (
            <div key={index} className="rounded border border-gray-100 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{risk.description || '-'}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {risk.severity || '-'}
                </span>
              </div>
              {risk.mitigation && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Mitigation : {risk.mitigation}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default DiscoveryBriefView;
