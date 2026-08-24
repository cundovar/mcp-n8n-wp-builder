import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { getRequestStatus, getStatusConfig, TONE_CLASSES } from '../lib/status';
import StatusBadge from './ui/StatusBadge';

const PLAN_ARTIFACTS = [
  { key: 'normalized_brief', label: 'Brief normalisé', icon: '📝' },
  { key: 'discovery_brief', label: 'Découverte', icon: '🔍' },
  { key: 'site_architecture', label: 'Architecture du site', icon: '🏗️' },
  { key: 'content_plan', label: 'Plan de contenu', icon: '📄' },
  { key: 'design_plan', label: 'Direction visuelle', icon: '🎨' },
  { key: 'wordpress_plan', label: 'Configuration WordPress', icon: '🔧' },
  { key: 'execution_plan', label: 'Plan d’exécution', icon: '📋' },
];

const ARTIFACT_STATUS = {
  pending: { label: 'Non produit', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  generating: { label: 'En préparation', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  generated: { label: 'Généré', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  validated: { label: 'Validé', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  stale: { label: 'À actualiser', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  failed: { label: 'Échec', classes: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLatestArtifact(artifacts = []) {
  return artifacts.reduce(
    (latest, artifact) => (!latest || artifact.version > latest.version ? artifact : latest),
    null,
  );
}

function PipelineView({ request, onViewArtifact }) {
  const [artifactsByType, setArtifactsByType] = useState({});
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);
  const [artifactError, setArtifactError] = useState(null);

  const currentStatus = getRequestStatus(request);
  const currentStatusInfo = getStatusConfig(currentStatus);
  const history = request.contract?.state_history || [];
  const hasContract = Boolean(request.contract?.build_state);

  useEffect(() => {
    let active = true;

    const fetchArtifacts = async () => {
      setLoadingArtifacts(true);
      try {
        const data = await apiRequest(`/requests/${request.requestId}/artifacts`);
        if (!active) return;
        setArtifactsByType(data.artifacts_by_type || {});
        setArtifactError(null);
      } catch (error) {
        if (!active) return;
        setArtifactError(`Impossible de charger les livrables : ${error.message}`);
      } finally {
        if (active) setLoadingArtifacts(false);
      }
    };

    fetchArtifacts();
    return () => {
      active = false;
    };
  }, [request.requestId]);

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-5 ${TONE_CLASSES[currentStatusInfo.tone] || TONE_CLASSES.neutral}`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">État actuel du projet</p>
            <h3 className="mt-1 text-xl font-bold">{currentStatusInfo.label}</h3>
            <p className="mt-1 text-sm opacity-80">
              {hasContract
                ? 'État enregistré par les workflows de construction et de publication.'
                : 'Statut hérité de la demande initiale.'}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section aria-labelledby="build-history-title" className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <div className="mb-5">
            <h3 id="build-history-title" className="text-lg font-bold">Historique de construction</h3>
            <p className="mt-1 text-sm text-slate-500">Étapes réellement enregistrées par le backend.</p>
          </div>

          {history.length > 0 ? (
            <ol className="space-y-0">
              {history.map((event, index) => {
                const info = getStatusConfig(event.state);
                const isLast = index === history.length - 1;
                return (
                  <li key={`${event.state}-${event.at || index}`} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast ? <span aria-hidden="true" className="absolute left-[11px] top-6 h-full w-px bg-slate-200 dark:bg-slate-700" /> : null}
                    <span aria-hidden="true" className={`relative mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-white dark:border-slate-900 ${info.tone === 'danger' ? 'bg-red-500' : info.tone === 'success' ? 'bg-emerald-500' : info.tone === 'warning' ? 'bg-amber-500' : info.tone === 'violet' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold">{info.label}</p>
                        {event.at ? <time className="text-xs text-slate-500" dateTime={event.at}>{formatDate(event.at)}</time> : null}
                      </div>
                      {event.reason ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.reason}</p> : null}
                      {event.actor ? <p className="mt-1 text-xs text-slate-400">Source : {event.actor}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
              <p className="font-semibold">Historique détaillé indisponible</p>
              <p className="mt-1">
                {hasContract
                  ? 'Le backend connaît l’état actuel, mais aucune transition n’a été conservée pour ce projet.'
                  : 'Ce projet a été créé avant l’activation du suivi staging. Les anciennes étapes ne sont pas reconstruites artificiellement.'}
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="deliverables-title" className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <div className="mb-4">
            <h3 id="deliverables-title" className="text-lg font-bold">Livrables du plan</h3>
            <p className="mt-1 text-sm text-slate-500">Dernière version enregistrée pour chaque livrable.</p>
          </div>

          {artifactError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{artifactError}</p>
          ) : null}

          <div className="space-y-2" aria-busy={loadingArtifacts}>
            {PLAN_ARTIFACTS.map((definition) => {
              const artifact = getLatestArtifact(artifactsByType[definition.key]);
              const status = ARTIFACT_STATUS[artifact?.status || 'pending'] || ARTIFACT_STATUS.pending;
              const content = (
                <>
                  <span aria-hidden="true" className="text-xl">{definition.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{definition.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {loadingArtifacts ? 'Chargement…' : artifact ? `Version ${artifact.version}` : 'Aucune version'}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status.classes}`}>{loadingArtifacts ? '…' : status.label}</span>
                </>
              );

              return artifact ? (
                <button key={definition.key} type="button" onClick={() => onViewArtifact?.(definition.key)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30">
                  {content}
                </button>
              ) : (
                <div key={definition.key} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 opacity-70 dark:border-slate-800">
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PipelineView;
