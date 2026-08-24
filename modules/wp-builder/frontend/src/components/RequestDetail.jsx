import { useEffect, useState } from 'react';
import { getRequestStatus } from '../lib/status';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ARTIFACT_LABELS = {
  normalized_brief: { label: 'Brief normalisé', icon: '📝' },
  discovery_brief: { label: 'Découverte', icon: '🔍' },
  site_architecture: { label: 'Architecture', icon: '🏗️' },
  content_plan: { label: 'Plan de contenu', icon: '📄' },
  design_plan: { label: 'Direction visuelle', icon: '🎨' },
  wordpress_plan: { label: 'Plan WordPress', icon: '🔧' },
  execution_plan: { label: 'Plan d’exécution', icon: '📋' },
};

function formatDate(dateString) {
  if (!dateString) return 'Non renseigné';
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RequestDetail({ request }) {
  const [validationContext, setValidationContext] = useState(null);
  const [copied, setCopied] = useState(null);
  const [exportError, setExportError] = useState(null);
  const displayStatus = getRequestStatus(request);
  const input = request.input || {};
  const planApproved = request.status === 'approved' || request.validation?.status === 'approved';

  useEffect(() => {
    if (request.status !== 'waiting_validation') {
      setValidationContext(null);
      return undefined;
    }

    let active = true;
    const fetchValidationContext = async () => {
      try {
        const response = await fetch(`${API_URL}/requests/${request.requestId}/validation-context`);
        if (!response.ok) return;
        const data = await response.json();
        if (active && data.ok) setValidationContext(data);
      } catch (error) {
        console.error('Erreur chargement contexte validation:', error);
      }
    };

    fetchValidationContext();
    return () => {
      active = false;
    };
  }, [request.requestId, request.status]);

  const showCopiedFeedback = (type) => {
    setCopied(type);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const copyPlan = async (format) => {
    setExportError(null);
    try {
      const response = await fetch(`${API_URL}/requests/${request.requestId}/ai-ready-plan?format=${format}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = format === 'json'
        ? JSON.stringify((await response.json()).plan, null, 2)
        : await response.text();
      await navigator.clipboard.writeText(content);
      showCopiedFeedback(format);
    } catch (error) {
      setExportError(`Impossible de copier le plan : ${error.message}`);
    }
  };

  const downloadPlan = async () => {
    setExportError(null);
    try {
      const response = await fetch(`${API_URL}/requests/${request.requestId}/ai-ready-plan?format=markdown`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `plan-${request.requestId.slice(0, 8)}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(`Impossible de télécharger le plan : ${error.message}`);
    }
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(request.result.bash_script);
    showCopiedFeedback('script');
  };

  const downloadScript = () => {
    const url = URL.createObjectURL(new Blob([request.result.bash_script], { type: 'text/x-sh' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `wp-build-${request.requestId.slice(0, 8)}.sh`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const validationTarget = validationContext?.current_target;
  const validationTargetInfo = ARTIFACT_LABELS[validationTarget?.artifact_type];

  return (
    <div className="space-y-6">
      <section aria-labelledby="project-brief-title">
        <div className="mb-4">
          <h3 id="project-brief-title" className="text-lg font-bold">Brief du projet</h3>
          <p className="mt-1 text-sm text-slate-500">Informations utilisées pour préparer le site.</p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Type de site</dt>
            <dd className="mt-1 font-semibold capitalize">{input.site_type || 'Site vitrine'}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Audience</dt>
            <dd className="mt-1 font-semibold">{input.target_audience || 'Non renseignée'}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70 sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Direction visuelle</dt>
            <dd className="mt-1 font-semibold">{input.design_preferences || 'À définir dans le plan design'}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h4 className="text-sm font-bold">Objectif</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
            {input.objective || 'Aucun objectif détaillé n’a été fourni.'}
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <h4 className="text-sm font-bold">Pages demandées</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {input.pages?.length ? input.pages.map((page) => <span key={page} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">{page}</span>) : <span className="text-sm text-slate-500">Aucune page précisée</span>}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <h4 className="text-sm font-bold">Fonctionnalités demandées</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {input.features?.length ? input.features.map((feature) => <span key={feature} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{feature}</span>) : <span className="text-sm text-slate-500">Aucune fonctionnalité précisée</span>}
            </div>
          </div>
        </div>
      </section>

      {request.status === 'waiting_validation' ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Validation requise</p>
          <h3 className="mt-1 text-lg font-bold text-amber-950 dark:text-amber-100">
            {validationContext?.display_state === 'post_revision_validation' ? 'Une nouvelle version est prête à relire' : 'Un livrable est prêt à être examiné'}
          </h3>
          {validationTarget ? (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              {validationTargetInfo?.icon || '📦'} {validationTargetInfo?.label || validationTarget.artifact_type} · version {validationTarget.version}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Utilisez le bouton « Action requise » dans l’en-tête pour ouvrir la validation.</p>
        </section>
      ) : null}

      {planApproved ? (
        <section aria-labelledby="plan-tools-title" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div>
            <h3 id="plan-tools-title" className="text-lg font-bold text-emerald-950 dark:text-emerald-100">Exports du plan</h3>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Le plan validé est disponible pour archivage ou réutilisation.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => copyPlan('json')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{copied === 'json' ? 'JSON copié' : 'Copier le JSON'}</button>
            <button type="button" onClick={() => copyPlan('prompt')} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">{copied === 'prompt' ? 'Prompt copié' : 'Copier le prompt'}</button>
            <button type="button" onClick={downloadPlan} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Télécharger en Markdown</button>
          </div>
          {exportError ? <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">{exportError}</p> : null}
        </section>
      ) : null}

      {displayStatus === 'failed' ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30">
          <h3 className="font-bold text-red-800 dark:text-red-200">Le traitement a échoué</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{request.result?.error || 'Aucun détail technique n’est disponible.'}</p>
        </section>
      ) : null}

      {request.status === 'completed' && request.result ? (
        <section aria-labelledby="legacy-result-title" className="space-y-4">
          <h3 id="legacy-result-title" className="text-lg font-bold">Résultat</h3>
          {request.result.summary ? (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
              {typeof request.result.summary === 'string' ? request.result.summary : <pre className="whitespace-pre-wrap">{JSON.stringify(request.result.summary, null, 2)}</pre>}
            </div>
          ) : null}
          {request.result.bash_script ? (
            <details className="rounded-xl border border-slate-200 dark:border-slate-700">
              <summary className="cursor-pointer px-4 py-3 font-semibold">Script Bash historique</summary>
              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-3 flex justify-end gap-2">
                  <button type="button" onClick={copyScript} className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold dark:bg-slate-700">{copied === 'script' ? 'Copié' : 'Copier'}</button>
                  <button type="button" onClick={downloadScript} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">Télécharger</button>
                </div>
                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-emerald-300"><code>{request.result.bash_script}</code></pre>
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">
        Projet créé le {formatDate(request.createdAt || request.created_at)}
        {request.completedAt || request.completed_at ? ` · terminé le ${formatDate(request.completedAt || request.completed_at)}` : ''}
      </footer>
    </div>
  );
}

export default RequestDetail;
