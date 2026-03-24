import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ARTIFACT_LABELS = {
  normalized_brief: { label: 'Brief normalisé', icon: '📝' },
  discovery_brief: { label: 'Découverte', icon: '🔍' },
  site_architecture: { label: 'Architecture', icon: '🏗️' },
  content_plan: { label: 'Plan contenu', icon: '📄' },
  design_plan: { label: 'Plan design', icon: '🎨' },
  wordpress_plan: { label: 'Plan WordPress', icon: '🔧' },
  execution_plan: { label: 'Plan exécution', icon: '📋' },
  execution_report: { label: 'Rapport', icon: '📊' },
};

function RequestDetail({ request, onBack, onApproveValidation, onViewValidation, onViewPipeline, onViewArtifacts, onViewExecution, onDeleteRequest, loading }) {
  const [copied, setCopied] = useState(false);
  const [validationContext, setValidationContext] = useState(null);

  // Charger le contexte de validation si en attente de validation
  useEffect(() => {
    if (request.status !== 'waiting_validation') {
      setValidationContext(null);
      return;
    }

    const fetchValidationContext = async () => {
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/validation-context`);
        const data = await res.json();
        if (data.ok) {
          setValidationContext(data);
        }
      } catch (err) {
        console.error('Erreur chargement contexte validation:', err);
      }
    };
    fetchValidationContext();
  }, [request.requestId, request.status]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      waiting_validation: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      pending: 'En attente',
      processing: 'En cours',
      waiting_validation: 'Validation requise',
      approved: 'Approuvé',
      completed: 'Terminé',
      failed: 'Échec',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyScript = async () => {
    if (request.result?.bash_script) {
      await navigator.clipboard.writeText(request.result.bash_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadScript = () => {
    if (request.result?.bash_script) {
      const blob = new Blob([request.result.bash_script], { type: 'text/x-sh' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wp-build-${request.requestId.slice(0, 8)}.sh`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const validationBrief = request.validation?.brief_architecte;
  const validationBriefText =
    typeof validationBrief === 'string'
      ? validationBrief
      : validationBrief
        ? JSON.stringify(validationBrief, null, 2)
        : null;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Retour à la liste
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">{request.input?.site_name || 'Sans nom'}</h2>
          <p className="text-gray-500 dark:text-gray-400">ID: {request.requestId}</p>
        </div>
        <div className="flex items-center gap-2">
          {onViewPipeline && (
            <button
              onClick={onViewPipeline}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition"
            >
              📊 Pipeline
            </button>
          )}
          {onViewArtifacts && (
            <button
              onClick={onViewArtifacts}
              className="px-3 py-1 text-sm bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-800 transition"
            >
              📦 Artefacts
            </button>
          )}
          {onViewExecution && (
            <button
              onClick={onViewExecution}
              className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition"
            >
              🚀 Exécution
            </button>
          )}
          {onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(request.requestId)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition disabled:opacity-50"
            >
              🗑️ Supprimer
            </button>
          )}
          {getStatusBadge(request.status)}
        </div>
      </div>

      {/* Input Details */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-3">Détails de la demande</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
            {request.input?.site_type || '-'}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Style:</span>{' '}
            {request.input?.design_style || '-'}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Couleur:</span>{' '}
            <span
              className="inline-block w-4 h-4 rounded align-middle"
              style={{ backgroundColor: request.input?.primary_color || '#3B82F6' }}
            />
            {' '}{request.input?.primary_color || '-'}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Créé le:</span>{' '}
            {formatDate(request.createdAt || request.created_at)}
          </div>
        </div>

        {request.input?.objective && (
          <div className="mt-3">
            <span className="text-gray-500 dark:text-gray-400">Objectif:</span>
            <p className="mt-1">{request.input.objective}</p>
          </div>
        )}

        {request.input?.pages?.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-500 dark:text-gray-400">Pages:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {request.input.pages.map((page) => (
                <span
                  key={page}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        )}

        {request.input?.features?.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-500 dark:text-gray-400">Fonctionnalités:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {request.input.features.map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {request.status === 'pending' && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">⏳</div>
          <p>En attente de traitement...</p>
        </div>
      )}

      {request.status === 'processing' && (
        <div className="text-center py-8 text-blue-500">
          <div className="text-4xl mb-2 animate-spin">⚙️</div>
          <p>Génération en cours...</p>
        </div>
      )}

      {request.status === 'approved' && (
        <div className="text-center py-8 text-green-600 dark:text-green-400">
          <div className="text-4xl mb-2">✅</div>
          <p>La validation a été approuvée.</p>
        </div>
      )}

      {request.status === 'waiting_validation' && (
        <div className="space-y-4">
          {/* Badge de type de validation */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {validationContext?.display_state === 'post_revision_validation' ? (
                <>
                  <span className="text-2xl">🔄</span>
                  <div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
                      Nouvelle version après révision
                    </span>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mt-1">
                      Validation requise
                    </h3>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl">🆕</span>
                  <div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                      Validation initiale
                    </span>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mt-1">
                      Validation requise
                    </h3>
                  </div>
                </>
              )}
            </div>

            {/* Target artifact info */}
            {validationContext?.current_target && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span>Artefact ciblé :</span>
                <span className="font-medium">
                  {ARTIFACT_LABELS[validationContext.current_target.artifact_type]?.icon || '📦'}{' '}
                  {ARTIFACT_LABELS[validationContext.current_target.artifact_type]?.label || validationContext.current_target.artifact_type}
                </span>
                <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-xs">
                  v{validationContext.current_target.version}
                </span>
              </div>
            )}

            <p className="text-amber-700 dark:text-amber-300 mt-2">
              {validationContext?.display_state === 'post_revision_validation'
                ? 'Une nouvelle version a été reconstruite suite à vos demandes de changements.'
                : 'Le brief architecte est prêt. Validez pour continuer le pipeline.'}
            </p>
          </div>

          {/* Contexte des changements demandés précédents */}
          {validationContext?.display_state === 'post_revision_validation' && validationContext?.last_decision && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 text-sm">
                Changements précédemment demandés
              </h4>
              {validationContext.last_decision.comment && (
                <p className="text-sm italic mb-2">"{validationContext.last_decision.comment}"</p>
              )}
              {validationContext.last_decision.requested_changes?.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 dark:text-orange-300">
                  {validationContext.last_decision.requested_changes.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {validationBriefText && (
            <div>
              <h3 className="font-semibold mb-2">Brief architecte</h3>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                <code>{validationBriefText}</code>
              </pre>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onApproveValidation(request.requestId)}
              disabled={loading}
              className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Validation en cours...' : '✓ Approuver rapidement'}
            </button>
            {onViewValidation && (
              <button
                type="button"
                onClick={onViewValidation}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                📝 Validation détaillée
              </button>
            )}
          </div>
        </div>
      )}

      {request.status === 'approved' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Plan approuvé</h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Le plan est prêt à être envoyé à une IA pour construire le site.
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/requests/${request.requestId}/ai-ready-plan?format=json`);
                    const data = await res.json();
                    await navigator.clipboard.writeText(JSON.stringify(data.plan, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Erreur copie plan:', err);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>📋</span>
                <span>{copied ? 'Copié!' : 'Copier le plan (JSON)'}</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/requests/${request.requestId}/ai-ready-plan?format=prompt`);
                    const text = await res.text();
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Erreur copie prompt:', err);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <span>🤖</span>
                <span>Copier le prompt IA</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/requests/${request.requestId}/ai-ready-plan?format=markdown`);
                    const text = await res.text();
                    const blob = new Blob([text], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `plan-${request.requestId.slice(0, 8)}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Erreur téléchargement:', err);
                  }
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
              >
                <span>⬇️</span>
                <span>Télécharger (Markdown)</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2">Prochaine étape</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Copiez le plan et collez-le dans Claude, ChatGPT ou une autre IA pour générer le code WordPress.
            </p>
          </div>
        </div>
      )}

      {request.status === 'failed' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Erreur</h3>
          <p className="text-red-600 dark:text-red-300">{request.result?.error || 'Erreur inconnue'}</p>
        </div>
      )}

      {request.status === 'completed' && request.result && (
        <div>
          {/* Summary */}
          {request.result.summary && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Résumé</h3>
              {typeof request.result.summary === 'string' ? (
                <p>{request.result.summary}</p>
              ) : (
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(request.result.summary, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Bash Script */}
          {request.result.bash_script && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Script Bash généré</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyScript}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    {copied ? '✓ Copié!' : '📋 Copier'}
                  </button>
                  <button
                    onClick={downloadScript}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    ⬇ Télécharger
                  </button>
                </div>
              </div>
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                  <code>{request.result.bash_script}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      {(request.completedAt || request.completed_at) && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
          Terminé le: {formatDate(request.completedAt || request.completed_at)}
        </div>
      )}
    </div>
  );
}

export default RequestDetail;
