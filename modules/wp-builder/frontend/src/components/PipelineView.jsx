import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PHASES = [
  { key: 'normalized_brief', label: 'Brief normalisé', icon: '📝' },
  { key: 'discovery_brief', label: 'Découverte', icon: '🔍' },
  { key: 'site_architecture', label: 'Architecture', icon: '🏗️' },
  { key: 'content_plan', label: 'Plan contenu', icon: '📄' },
  { key: 'design_plan', label: 'Plan design', icon: '🎨' },
  { key: 'wordpress_plan', label: 'Plan WordPress', icon: '🔧' },
  { key: 'execution_plan', label: 'Plan exécution', icon: '📋' },
  { key: 'execution', label: 'Exécution', icon: '🚀' },
];

const STATUS_STYLES = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-400',
    dot: 'bg-gray-400',
    label: 'En attente',
  },
  running: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 animate-pulse',
    label: 'En cours',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-400 dark:border-green-500',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'Terminé',
  },
  waiting_validation: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Validation requise',
  },
  changes_requested: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-orange-400 dark:border-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    label: 'Changements demandés',
  },
  revising: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-400 dark:border-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500 animate-pulse',
    label: 'Révision en cours',
  },
  approved: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-400 dark:border-green-500',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'Approuvé',
  },
  failed: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-400 dark:border-red-500',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    label: 'Échec',
  },
  skipped: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-400 dark:text-gray-500',
    dot: 'bg-gray-300',
    label: 'Ignoré',
  },
};

function PipelineView({ request, onBack, onViewArtifact }) {
  const pipelinePhases = request.pipeline?.phases || [];
  const currentPhase = request.current_phase;
  const [validationContext, setValidationContext] = useState(null);

  // Charger le contexte de validation
  useEffect(() => {
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
  }, [request.requestId]);

  // Construire l'état de chaque phase
  const getPhaseStatus = (phaseKey) => {
    const phase = pipelinePhases.find((p) => p.name === phaseKey);
    if (phase) {
      return phase.status || 'pending';
    }
    // Si pas de données pipeline, déduire du current_phase
    if (currentPhase) {
      const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);
      const phaseIndex = PHASES.findIndex((p) => p.key === phaseKey);
      if (phaseIndex < currentIndex) return 'completed';
      if (phaseIndex === currentIndex) return 'running';
    }
    return 'pending';
  };

  const getPhaseData = (phaseKey) => {
    return pipelinePhases.find((p) => p.name === phaseKey) || {};
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Retour à la liste
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Pipeline</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {request.input?.site_name || 'Sans nom'} • {request.requestId.slice(0, 8)}
        </p>
      </div>

      {/* Current phase indicator */}
      {currentPhase && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {PHASES.find((p) => p.key === currentPhase)?.icon || '📍'}
            </span>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Phase actuelle</p>
              <p className="text-blue-600 dark:text-blue-300">
                {PHASES.find((p) => p.key === currentPhase)?.label || currentPhase}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline timeline */}
      <div className="space-y-3">
        {PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase.key);
          const phaseData = getPhaseData(phase.key);
          const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;
          const isLast = index === PHASES.length - 1;

          return (
            <div key={phase.key} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-12 w-0.5 h-6 ${
                    status === 'completed' || status === 'approved'
                      ? 'bg-green-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}

              {/* Phase card */}
              <div
                className={`flex items-start gap-4 p-4 rounded-lg border-2 ${styles.bg} ${styles.border} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onViewArtifact && onViewArtifact(phase.key)}
              >
                {/* Status dot */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-4 h-4 rounded-full ${styles.dot}`} />
                </div>

                {/* Phase info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{phase.icon}</span>
                    <span className={`font-medium ${styles.text}`}>{phase.label}</span>
                  </div>

                  {/* Status label */}
                  <p className={`text-sm mt-1 ${styles.text}`}>{styles.label}</p>

                  {/* Error message */}
                  {phaseData.error && (
                    <p className="text-sm mt-2 text-red-600 dark:text-red-400">
                      {phaseData.error}
                    </p>
                  )}

                  {/* Timestamps */}
                  {(phaseData.started_at || phaseData.completed_at) && (
                    <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 flex gap-4">
                      {phaseData.started_at && (
                        <span>Début: {formatDate(phaseData.started_at)}</span>
                      )}
                      {phaseData.completed_at && (
                        <span>Fin: {formatDate(phaseData.completed_at)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation cycle */}
      {(request.validation?.status || validationContext) && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-3">Cycle de validation</h3>

          {/* Display state badge */}
          {validationContext?.display_state && (
            <div className="mb-3">
              {validationContext.display_state === 'initial_validation' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                  🆕 Validation initiale
                </span>
              )}
              {validationContext.display_state === 'post_revision_validation' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
                  🔄 Validation après révision
                </span>
              )}
              {validationContext.display_state === 'revising' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                  ⏳ Reconstruction en cours
                </span>
              )}
              {validationContext.display_state === 'approved' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                  ✅ Approuvé
                </span>
              )}
              {validationContext.display_state === 'rejected' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
                  ❌ Rejeté
                </span>
              )}
            </div>
          )}

          <div className="text-sm space-y-2">
            {/* Current target */}
            {validationContext?.current_target && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Cible actuelle:</span>
                <span className="font-medium">
                  {PHASES.find(p => p.key === validationContext.current_target.artifact_type)?.icon || '📦'}{' '}
                  {PHASES.find(p => p.key === validationContext.current_target.artifact_type)?.label || validationContext.current_target.artifact_type}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                  v{validationContext.current_target.version}
                </span>
              </div>
            )}

            {/* Last decision */}
            {validationContext?.last_decision && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Dernière décision:</span>{' '}
                <span className={`font-medium ${
                  validationContext.last_decision.decision === 'approved'
                    ? 'text-green-600'
                    : validationContext.last_decision.decision === 'changes_requested'
                      ? 'text-orange-600'
                      : 'text-red-600'
                }`}>
                  {validationContext.last_decision.decision === 'approved' && '✅ Approuvé'}
                  {validationContext.last_decision.decision === 'changes_requested' && '📝 Changements demandés'}
                  {validationContext.last_decision.decision === 'rejected' && '❌ Rejeté'}
                </span>
                {validationContext.last_decision.created_by && (
                  <span className="text-gray-400"> par {validationContext.last_decision.created_by}</span>
                )}
              </div>
            )}

            {/* Stats */}
            {validationContext?.total_decisions > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {validationContext.total_decisions} décision{validationContext.total_decisions > 1 ? 's' : ''}
                  {validationContext.changes_requested_count > 0 && (
                    <span className="text-orange-600"> • {validationContext.changes_requested_count} révision{validationContext.changes_requested_count > 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineView;
