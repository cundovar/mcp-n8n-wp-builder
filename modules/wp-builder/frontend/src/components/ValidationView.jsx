import { useState, useEffect } from 'react';
import ArtifactHumanView from './artifacts/ArtifactHumanView';

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

const DISPLAY_STATE_CONFIG = {
  initial_validation: {
    badge: 'Validation initiale',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Vous validez la première version du plan',
    icon: '🆕',
  },
  post_revision_validation: {
    badge: 'Nouvelle version après révision',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    description: 'Vous relisez la version reconstruite après demande de changements',
    icon: '🔄',
  },
  revising: {
    badge: 'Révision en cours',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    description: 'Le pipeline reconstruit une nouvelle version',
    icon: '⏳',
  },
  rejected: {
    badge: 'Validation rejetée',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Le pipeline est arrêté',
    icon: '❌',
  },
  approved: {
    badge: 'Approuvé',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'La validation est terminée',
    icon: '✅',
  },
  default: {
    badge: 'En attente',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    description: '',
    icon: '⏸️',
  },
};

function ValidationView({ request, onBack, onValidationComplete, onViewRevisions }) {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [requestedChanges, setRequestedChanges] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationContext, setValidationContext] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Le contexte de validation décrit l'etat global de la demande:
  // quel artefact est actuellement cible, si on est en relecture, etc.
  useEffect(() => {
    const fetchValidationContext = async () => {
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/validation-context`);
        const data = await res.json();
        console.log('Contexte de validation:', data);
        if (data.ok) {
          setValidationContext(data);
        }
      } catch (err) {
        console.error('Erreur chargement contexte validation:', err);
      }
    };
    fetchValidationContext();
  }, [request.requestId]);

  // On charge la liste complete des artefacts puis on ne garde que ceux
  // effectivement consultables/validables par l'utilisateur.
  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/artifacts`);
        const data = await res.json();
        console.log('Artifacts:', data);
        const allArtifacts = data.artifacts || [];
        const validatableArtifacts = allArtifacts.filter(
          (a) => a.status === 'generated' || a.status === 'validated'
        );
        console.log('Validatable artifacts:', validatableArtifacts);
        setArtifacts(validatableArtifacts);

        // La vue essaie d'abord de preselecitonner la cible courante renvoyee
        // par le backend. On garde `request.validation` en secours si le contexte
        // n'est pas encore charge ou n'est pas aligne.
        const preferredTarget =
          validationContext?.current_target ||
          (request.validation?.target_artifact
            ? {
                artifact_type: request.validation.target_artifact,
                version: request.validation.target_version,
              }
            : null);

        if (preferredTarget) {
          const target = validatableArtifacts.find(
            (a) =>
              a.artifact_type === preferredTarget.artifact_type &&
              a.version === preferredTarget.version
          );
          if (target) {
            setSelectedArtifact(target);
            return;
          }
        }

        // Si aucune cible explicite n'est trouvable, on affiche simplement le
        // premier artefact validable pour ne pas laisser la zone d'aperçu vide.
        if (validatableArtifacts.length > 0) {
          setSelectedArtifact(validatableArtifacts[0]);
        }
      } catch (err) {
        console.error('Erreur chargement artefacts:', err);
      }
    };
    fetchArtifacts();

  }, [request.requestId, request.validation, validationContext]);

  const handleAddChange = () => {
    setRequestedChanges([...requestedChanges, '']);
  };

  const handleRemoveChange = (index) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index));
  };

  const handleChangeUpdate = (index, value) => {
    const newChanges = [...requestedChanges];
    newChanges[index] = value;
    setRequestedChanges(newChanges);
  };

  const handleSubmit = async () => {
    if (!selectedArtifact || !decision) {
      setError('Veuillez sélectionner un artefact et une décision');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        artifact_type: selectedArtifact.artifact_type,
        artifact_version: selectedArtifact.version,
        decision,
        comment,
        requested_changes:
          decision === 'changes_requested'
            ? requestedChanges.filter((c) => c.trim() !== '')
            : [],
        created_by: 'user',
      };

      const res = await fetch(
        `${API_URL}/requests/${request.requestId}/validation-decisions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setSuccess(
        decision === 'approved'
          ? 'Artefact approuvé avec succès'
          : decision === 'changes_requested'
            ? 'Demande de changements enregistrée. Le pipeline va reconstruire une nouvelle version.'
            : 'Artefact rejeté. Le pipeline est arrêté.'
      );

      if (onValidationComplete) {
        setTimeout(() => {
          onValidationComplete(data);
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionStyle = (d) => {
    if (decision === d) {
      switch (d) {
        case 'approved':
          return 'bg-green-600 text-white border-green-600';
        case 'changes_requested':
          return 'bg-orange-600 text-white border-orange-600';
        case 'rejected':
          return 'bg-red-600 text-white border-red-600';
        default:
          return '';
      }
    }
    return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400';
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
    });
  };

  const displayState = validationContext?.display_state || 'default';
  const stateConfig = DISPLAY_STATE_CONFIG[displayState] || DISPLAY_STATE_CONFIG.default;
  const currentTarget = validationContext?.current_target;
  const lastDecision = validationContext?.last_decision;
  const previousTarget = validationContext?.previous_target;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Retour
      </button>

      {/* Header avec contexte */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{stateConfig.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">Validation</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${stateConfig.badgeClass}`}>
              {stateConfig.badge}
            </span>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          {request.input?.site_name || 'Sans nom'}
        </p>
        {stateConfig.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stateConfig.description}
          </p>
        )}
      </div>

      {/* Résumé de la validation courante */}
      {currentTarget && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Artefact en revue
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {ARTIFACT_LABELS[currentTarget.artifact_type]?.icon || '📦'}
            </span>
            <span className="font-medium">
              {ARTIFACT_LABELS[currentTarget.artifact_type]?.label || currentTarget.artifact_type}
            </span>
            <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-sm">
              v{currentTarget.version}
            </span>
          </div>
          {previousTarget && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              Comparé à la version précédente: v{previousTarget.version}
            </p>
          )}
        </div>
      )}

      {/* Contexte : dernière demande de changement */}
      {displayState === 'post_revision_validation' && lastDecision && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
            Cette validation fait suite à une demande de changements
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Le {formatDate(lastDecision.created_at)} par {lastDecision.created_by}
          </p>
          {lastDecision.comment && (
            <p className="text-sm mb-2 italic">"{lastDecision.comment}"</p>
          )}
          {lastDecision.requested_changes?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                Changements demandés :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {lastDecision.requested_changes.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          )}
          {onViewRevisions && previousTarget && (
            <button
              onClick={() => onViewRevisions(currentTarget?.artifact_type)}
              className="mt-3 text-sm text-orange-700 dark:text-orange-300 hover:underline"
            >
              🔄 Comparer v{previousTarget.version} → v{currentTarget?.version}
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* État revising ou rejected */}
      {displayState === 'revising' && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 animate-spin">⚙️</div>
          <p className="text-gray-500 dark:text-gray-400">
            Le pipeline reconstruit une nouvelle version...
          </p>
        </div>
      )}

      {displayState === 'rejected' && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🛑</div>
          <p className="text-gray-500 dark:text-gray-400">
            Cette demande a été rejetée. Le pipeline est arrêté.
          </p>
        </div>
      )}

      {/* Seuls ces deux etats ouvrent la zone interactive:
          choix de l'artefact, apercu et decision utilisateur. */}
      {(displayState === 'initial_validation' || displayState === 'post_revision_validation') && (
        <>
          {/* Cette liste montre tous les artefacts validables.
              Le badge "cible" vient du contexte backend, alors que le style
              "selectionne" correspond au choix actuel dans l'UI. */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Artefact à valider</h3>
            {artifacts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Aucun artefact disponible pour validation
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {artifacts.map((artifact) => {
                  const info = ARTIFACT_LABELS[artifact.artifact_type] || {
                    label: artifact.artifact_type,
                    icon: '📦',
                  };
                  const isSelected =
                    selectedArtifact?.artifact_type === artifact.artifact_type &&
                    selectedArtifact?.version === artifact.version;
                  const isTarget =
                    currentTarget?.artifact_type === artifact.artifact_type &&
                    currentTarget?.version === artifact.version;

                  return (
                    <button
                      key={`${artifact.artifact_type}-${artifact.version}`}
                      onClick={() => setSelectedArtifact(artifact)}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{info.label}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">v{artifact.version}</span>
                            {isTarget && (
                              <span className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
                                ciblé
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* La lecture "humaine" passe par ArtifactHumanView.
              Si un type n'a pas encore de composant specialise, un fallback
              lisible est affiche avant le JSON brut optionnel. */}
          {selectedArtifact && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
                <div>
                  <h4 className="font-semibold">Aperçu lisible</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Lecture métier de l'artefact sélectionné
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={showRawJson}
                      onChange={(e) => setShowRawJson(e.target.checked)}
                    />
                    Voir aussi le JSON brut
                  </label>
                  {onViewRevisions && (
                    <button
                      onClick={() => onViewRevisions(selectedArtifact.artifact_type)}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      🔄 Voir les révisions
                    </button>
                  )}
                </div>
              </div>
              <ArtifactHumanView artifact={selectedArtifact} showRaw={showRawJson} />
            </div>
          )}

          {/* La decision envoyee ci-dessous pilote ensuite la suite du workflow:
              approbation, demande de changements ou arret. */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Décision</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDecision('approved')}
                className={`p-4 rounded-lg border-2 transition ${getDecisionStyle('approved')}`}
              >
                <div className="text-2xl mb-1">✅</div>
                <div className="font-medium">Approuver</div>
                <p className="text-xs mt-1 opacity-75">Valider et continuer</p>
              </button>
              <button
                onClick={() => setDecision('changes_requested')}
                className={`p-4 rounded-lg border-2 transition ${getDecisionStyle('changes_requested')}`}
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="font-medium">Changements</div>
                <p className="text-xs mt-1 opacity-75">Demander des modifications</p>
              </button>
              <button
                onClick={() => setDecision('rejected')}
                className={`p-4 rounded-lg border-2 transition ${getDecisionStyle('rejected')}`}
              >
                <div className="text-2xl mb-1">❌</div>
                <div className="font-medium">Rejeter</div>
                <p className="text-xs mt-1 opacity-75">Arrêter le pipeline</p>
              </button>
            </div>
          </div>

          {/* Commentaire */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Changements demandés */}
          {decision === 'changes_requested' && (
            <div className="mb-6">
              <label className="block font-semibold mb-2">Changements demandés</label>
              <div className="space-y-2">
                {requestedChanges.map((change, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={change}
                      onChange={(e) => handleChangeUpdate(index, e.target.value)}
                      placeholder={`Changement ${index + 1}...`}
                      className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                    />
                    {requestedChanges.length > 1 && (
                      <button
                        onClick={() => handleRemoveChange(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddChange}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  + Ajouter un changement
                </button>
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedArtifact || !decision}
            className={`w-full py-3 rounded-lg font-medium transition ${
              !selectedArtifact || !decision
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : decision === 'approved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : decision === 'changes_requested'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading
              ? 'Envoi en cours...'
              : decision === 'approved'
                ? 'Approuver cet artefact'
                : decision === 'changes_requested'
                  ? 'Demander ces changements'
                  : decision === 'rejected'
                    ? 'Rejeter et arrêter'
                    : 'Sélectionnez une décision'}
          </button>
        </>
      )}

      {/* Historique rapide */}
      {validationContext?.total_decisions > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {validationContext.total_decisions} décision{validationContext.total_decisions > 1 ? 's' : ''} enregistrée{validationContext.total_decisions > 1 ? 's' : ''}
            {validationContext.changes_requested_count > 0 && (
              <span> dont {validationContext.changes_requested_count} demande{validationContext.changes_requested_count > 1 ? 's' : ''} de changements</span>
            )}
          </p>
          {onViewRevisions && (
            <button
              onClick={() => onViewRevisions(null)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              📋 Voir l'historique complet des révisions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidationView;
