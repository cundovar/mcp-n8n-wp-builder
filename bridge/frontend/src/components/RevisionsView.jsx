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

const DECISION_STYLES = {
  approved: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: '✅',
    label: 'Approuvé',
  },
  changes_requested: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: '📝',
    label: 'Changements demandés',
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: '❌',
    label: 'Rejeté',
  },
};

function RevisionsView({ request, onBack, initialArtifactType }) {
  const [decisions, setDecisions] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedType, setSelectedType] = useState(initialArtifactType || null);
  const [compareMode, setCompareMode] = useState(false);
  const [leftVersion, setLeftVersion] = useState(null);
  const [rightVersion, setRightVersion] = useState(null);
  const [leftArtifact, setLeftArtifact] = useState(null);
  const [rightArtifact, setRightArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [artifactsByType, setArtifactsByType] = useState({});

  // Charger les décisions de validation
  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/validation-decisions`);
        const data = await res.json();
        setDecisions(data.decisions || []);
      } catch (err) {
        console.error('Erreur chargement décisions:', err);
      }
    };
    fetchDecisions();
  }, [request.requestId]);

  // Charger les artefacts disponibles
  useEffect(() => {
    const fetchArtifacts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/artifacts`);
        const data = await res.json();
        setArtifactsByType(data.artifacts_by_type || {});

        // Présélectionner le premier type si aucun n'est sélectionné
        if (!selectedType && Object.keys(data.artifacts_by_type || {}).length > 0) {
          setSelectedType(Object.keys(data.artifacts_by_type)[0]);
        }
      } catch (err) {
        console.error('Erreur chargement artefacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [request.requestId]);

  // Charger les versions quand un type est sélectionné
  useEffect(() => {
    if (!selectedType) {
      setVersions([]);
      return;
    }

    const fetchVersions = async () => {
      try {
        const res = await fetch(
          `${API_URL}/requests/${request.requestId}/artifacts/${selectedType}/versions`
        );
        const data = await res.json();
        setVersions(data.versions || []);

        // Présélectionner les deux dernières versions pour comparaison
        if (data.versions?.length >= 2) {
          setRightVersion(data.versions[0].version);
          setLeftVersion(data.versions[1].version);
        } else if (data.versions?.length === 1) {
          setRightVersion(data.versions[0].version);
          setLeftVersion(null);
        }
      } catch (err) {
        console.error('Erreur chargement versions:', err);
      }
    };
    fetchVersions();
  }, [selectedType, request.requestId]);

  // Charger les artefacts pour comparaison
  useEffect(() => {
    if (!selectedType) return;

    const fetchArtifact = async (version, setter) => {
      if (!version) {
        setter(null);
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/requests/${request.requestId}/artifacts/${selectedType}?version=${version}`
        );
        const data = await res.json();
        setter(data.artifact);
      } catch (err) {
        console.error('Erreur chargement artefact:', err);
      }
    };

    fetchArtifact(leftVersion, setLeftArtifact);
    fetchArtifact(rightVersion, setRightArtifact);
  }, [selectedType, leftVersion, rightVersion, request.requestId]);

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

  // Filtrer les décisions par type d'artefact
  const filteredDecisions = selectedType
    ? decisions.filter((d) => d.artifact_type === selectedType)
    : decisions;

  // Construire la timeline: relier chaque décision à la version suivante
  const buildTimeline = () => {
    if (!selectedType) return [];

    // Trier les décisions par date (plus anciennes en premier)
    const sortedDecisions = [...filteredDecisions].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    // Trier les versions par numéro
    const sortedVersions = [...versions].sort((a, b) => a.version - b.version);

    const timeline = [];

    sortedVersions.forEach((version, vIndex) => {
      // Ajouter l'entrée de version
      timeline.push({
        type: 'version',
        version: version.version,
        status: version.status,
        created_at: version.created_at,
        data: version,
      });

      // Trouver les décisions pour cette version
      const decisionsForVersion = sortedDecisions.filter(
        (d) => d.artifact_version === version.version
      );

      decisionsForVersion.forEach((decision) => {
        timeline.push({
          type: 'decision',
          decision: decision.decision,
          version: decision.artifact_version,
          created_at: decision.created_at,
          data: decision,
          // Si changes_requested, indiquer la prochaine version
          next_version: decision.decision === 'changes_requested' && vIndex < sortedVersions.length - 1
            ? sortedVersions[vIndex + 1].version
            : null,
        });
      });
    });

    return timeline;
  };

  const timelineItems = buildTimeline();

  // Fonction pour passer en mode comparaison avec versions prédéfinies
  const compareVersions = (oldVersion, newVersion) => {
    setLeftVersion(oldVersion);
    setRightVersion(newVersion);
    setCompareMode(true);
  };

  // Générer un diff simple entre deux objets JSON
  const generateDiff = (left, right) => {
    if (!left && !right) return [];

    const leftStr = JSON.stringify(left, null, 2);
    const rightStr = JSON.stringify(right, null, 2);

    const leftLines = leftStr ? leftStr.split('\n') : [];
    const rightLines = rightStr ? rightStr.split('\n') : [];

    const diff = [];
    const maxLen = Math.max(leftLines.length, rightLines.length);

    for (let i = 0; i < maxLen; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';

      if (leftLine === rightLine) {
        diff.push({ type: 'unchanged', left: leftLine, right: rightLine, lineNum: i + 1 });
      } else if (!leftLine) {
        diff.push({ type: 'added', left: '', right: rightLine, lineNum: i + 1 });
      } else if (!rightLine) {
        diff.push({ type: 'removed', left: leftLine, right: '', lineNum: i + 1 });
      } else {
        diff.push({ type: 'modified', left: leftLine, right: rightLine, lineNum: i + 1 });
      }
    }

    return diff;
  };

  const availableTypes = Object.keys(artifactsByType);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Retour
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Révisions</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {request.input?.site_name || 'Sans nom'} • Historique et comparaison
        </p>
      </div>

      {/* Sélecteur de type d'artefact */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type d'artefact
        </label>
        <div className="flex gap-2 flex-wrap">
          {availableTypes.map((type) => {
            const info = ARTIFACT_LABELS[type] || { label: type, icon: '📦' };
            const isSelected = selectedType === type;
            const typeDecisions = decisions.filter((d) => d.artifact_type === type);

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                {typeDecisions.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    {typeDecisions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle mode */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCompareMode(false)}
          className={`px-4 py-2 rounded-lg transition ${
            !compareMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 Historique
        </button>
        <button
          onClick={() => setCompareMode(true)}
          className={`px-4 py-2 rounded-lg transition ${
            compareMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
          }`}
        >
          🔄 Comparer
        </button>
      </div>

      {/* Résumé du cycle */}
      {(filteredDecisions.length > 0 || versions.length > 0) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Résumé du cycle</h4>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Versions :</span>{' '}
                  <span className="font-medium">{versions.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Décisions :</span>{' '}
                  <span className="font-medium">{filteredDecisions.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Révisions :</span>{' '}
                  <span className="font-medium text-orange-600">
                    {filteredDecisions.filter(d => d.decision === 'changes_requested').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Raccourci comparaison rapide */}
            {versions.length >= 2 && (
              <button
                onClick={() => {
                  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
                  compareVersions(sortedVersions[1].version, sortedVersions[0].version);
                }}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Comparer dernières versions</span>
              </button>
            )}
          </div>
        </div>
      )}

      {!compareMode ? (
        /* Timeline des décisions et versions */
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Timeline du cycle de révision
            {selectedType && (
              <span className="text-gray-500 font-normal ml-2">
                ({ARTIFACT_LABELS[selectedType]?.label || selectedType})
              </span>
            )}
          </h3>

          {timelineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>Aucun historique pour cet artefact</p>
            </div>
          ) : (
            <div className="relative">
              {/* Ligne verticale de timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />

              <div className="space-y-4">
                {timelineItems.map((item, index) => {
                  if (item.type === 'version') {
                    // Entrée de version
                    return (
                      <div key={`version-${item.version}`} className="relative flex items-start gap-4 pl-12">
                        {/* Point sur la timeline */}
                        <div className="absolute left-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />

                        <div className="flex-grow p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📦</span>
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                Version {item.version}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                item.status === 'approved'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : item.status === 'current'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Entrée de décision
                    const style = DECISION_STYLES[item.decision] || DECISION_STYLES.approved;
                    const decision = item.data;

                    return (
                      <div key={`decision-${decision._id || index}`} className="relative flex items-start gap-4 pl-12">
                        {/* Point sur la timeline */}
                        <div className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                          item.decision === 'approved'
                            ? 'bg-green-500'
                            : item.decision === 'changes_requested'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                        }`} />

                        {/* Flèche vers la prochaine version si changes_requested */}
                        {item.next_version && (
                          <div className="absolute left-5 top-8 text-orange-500 text-xs">
                            ↓ v{item.next_version}
                          </div>
                        )}

                        <div className={`flex-grow p-4 rounded-lg border ${style.bg} ${style.border}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{style.icon}</span>
                              <div>
                                <p className={`font-medium ${style.text}`}>{style.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  sur v{decision.artifact_version}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                              <p>{formatDate(decision.created_at)}</p>
                              {decision.created_by && <p>par {decision.created_by}</p>}
                            </div>
                          </div>

                          {decision.comment && (
                            <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Commentaire
                              </p>
                              <p className="text-sm">{decision.comment}</p>
                            </div>
                          )}

                          {decision.requested_changes?.length > 0 && (
                            <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Changements demandés
                              </p>
                              <ul className="list-disc list-inside space-y-1">
                                {decision.requested_changes.map((change, idx) => (
                                  <li key={idx} className="text-sm">
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bouton comparer si une nouvelle version a été produite */}
                          {item.next_version && (
                            <button
                              onClick={() => compareVersions(decision.artifact_version, item.next_version)}
                              className="mt-3 px-3 py-1.5 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition flex items-center gap-2"
                            >
                              <span>🔄</span>
                              <span>Comparer v{decision.artifact_version} → v{item.next_version}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mode comparaison */
        <div>
          <h3 className="font-semibold text-lg mb-4">
            Comparaison des versions
            {selectedType && (
              <span className="text-gray-500 font-normal ml-2">
                ({ARTIFACT_LABELS[selectedType]?.label || selectedType})
              </span>
            )}
          </h3>

          {versions.length < 2 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📄</div>
              <p>Il faut au moins 2 versions pour comparer</p>
            </div>
          ) : (
            <>
              {/* Sélecteurs de version */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version ancienne (gauche)
                  </label>
                  <select
                    value={leftVersion || ''}
                    onChange={(e) => setLeftVersion(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        v{v.version} - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version récente (droite)
                  </label>
                  <select
                    value={rightVersion || ''}
                    onChange={(e) => setRightVersion(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        v{v.version} - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diff viewer */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                  <div className="px-4 py-2 font-medium text-sm border-r border-gray-300 dark:border-gray-600">
                    v{leftVersion || '?'}{' '}
                    {leftArtifact?.status && (
                      <span className="text-gray-500">({leftArtifact.status})</span>
                    )}
                  </div>
                  <div className="px-4 py-2 font-medium text-sm">
                    v{rightVersion || '?'}{' '}
                    {rightArtifact?.status && (
                      <span className="text-gray-500">({rightArtifact.status})</span>
                    )}
                  </div>
                </div>

                <div className="max-h-[500px] overflow-auto">
                  {generateDiff(leftArtifact?.payload, rightArtifact?.payload).map(
                    (line, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-2 text-xs font-mono ${
                          line.type === 'added'
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : line.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : line.type === 'modified'
                                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                : ''
                        }`}
                      >
                        <div
                          className={`px-4 py-0.5 border-r border-gray-200 dark:border-gray-700 ${
                            line.type === 'removed' || line.type === 'modified'
                              ? 'text-red-700 dark:text-red-300'
                              : ''
                          }`}
                        >
                          <span className="text-gray-400 mr-2 select-none">{line.lineNum}</span>
                          {line.type === 'removed' && (
                            <span className="text-red-500 mr-1">-</span>
                          )}
                          {line.type === 'modified' && (
                            <span className="text-yellow-500 mr-1">~</span>
                          )}
                          {line.left}
                        </div>
                        <div
                          className={`px-4 py-0.5 ${
                            line.type === 'added' || line.type === 'modified'
                              ? 'text-green-700 dark:text-green-300'
                              : ''
                          }`}
                        >
                          <span className="text-gray-400 mr-2 select-none">{line.lineNum}</span>
                          {line.type === 'added' && (
                            <span className="text-green-500 mr-1">+</span>
                          )}
                          {line.type === 'modified' && (
                            <span className="text-yellow-500 mr-1">~</span>
                          )}
                          {line.right}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Légende */}
              <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded" /> Ajouté
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded" /> Supprimé
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 rounded" /> Modifié
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RevisionsView;
