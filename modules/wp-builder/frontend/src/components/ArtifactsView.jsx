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

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600',
  generating: 'bg-blue-100 text-blue-700',
  generated: 'bg-green-100 text-green-700',
  validated: 'bg-emerald-100 text-emerald-700',
  stale: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  pending: 'En attente',
  generating: 'Génération...',
  generated: 'Généré',
  validated: 'Validé',
  stale: 'Obsolète',
  failed: 'Échec',
};

function ArtifactsView({ request, onBack, initialArtifactType, onViewRevisions }) {
  const [artifacts, setArtifacts] = useState([]);
  const [artifactsByType, setArtifactsByType] = useState({});
  const [selectedType, setSelectedType] = useState(initialArtifactType || null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les artefacts
  useEffect(() => {
    const fetchArtifacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/artifacts`);
        const data = await res.json();
        setArtifacts(data.artifacts || []);
        setArtifactsByType(data.artifacts_by_type || {});
      } catch (err) {
        setError('Erreur lors du chargement des artefacts');
        console.error(err);
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
        // Sélectionner la dernière version par défaut
        if (data.artifacts?.length > 0) {
          setSelectedArtifact(data.artifacts[0]);
        }
      } catch (err) {
        console.error('Erreur chargement versions:', err);
      }
    };
    fetchVersions();
  }, [selectedType, request.requestId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectVersion = async (version) => {
    try {
      const res = await fetch(
        `${API_URL}/requests/${request.requestId}/artifacts/${selectedType}?version=${version}`
      );
      const data = await res.json();
      setSelectedArtifact(data.artifact);
    } catch (err) {
      console.error('Erreur chargement artefact:', err);
    }
  };

  // Liste des types d'artefacts disponibles
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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-1">Artefacts</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {request.input?.site_name || 'Sans nom'} • {artifacts.length} artefact
            {artifacts.length > 1 ? 's' : ''}
          </p>
        </div>
        {onViewRevisions && (
          <button
            onClick={() => onViewRevisions(selectedType)}
            className="px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-sm font-medium"
          >
            🔄 Révisions & Historique
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2 animate-spin">⚙️</div>
          <p>Chargement des artefacts...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Liste des types */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase mb-3">
              Types
            </h3>
            {availableTypes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Aucun artefact disponible
              </p>
            ) : (
              availableTypes.map((type) => {
                const info = ARTIFACT_LABELS[type] || { label: type, icon: '📦' };
                const typeArtifacts = artifactsByType[type] || [];
                const latestStatus = typeArtifacts[0]?.status || 'pending';
                const isSelected = selectedType === type;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{info.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[latestStatus] || STATUS_STYLES.pending}`}
                          >
                            {STATUS_LABELS[latestStatus] || latestStatus}
                          </span>
                          <span className="text-xs text-gray-500">
                            v{typeArtifacts[0]?.version || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Détail de l'artefact */}
          <div className="md:col-span-2">
            {!selectedType ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">👈</div>
                <p>Sélectionnez un type d'artefact</p>
              </div>
            ) : (
              <div>
                {/* Sélecteur de version */}
                {versions.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Version
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {versions.map((v) => (
                        <button
                          key={v.version}
                          onClick={() => handleSelectVersion(v.version)}
                          className={`px-3 py-1 rounded-lg text-sm transition ${
                            selectedArtifact?.version === v.version
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          v{v.version}
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${STATUS_STYLES[v.status] || ''}`}
                          >
                            {STATUS_LABELS[v.status] || v.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Métadonnées */}
                {selectedArtifact && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Version:</span>{' '}
                        <span className="font-medium">{selectedArtifact.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Statut:</span>{' '}
                        <span
                          className={`px-2 py-0.5 rounded ${STATUS_STYLES[selectedArtifact.status] || ''}`}
                        >
                          {STATUS_LABELS[selectedArtifact.status] || selectedArtifact.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Créé:</span>{' '}
                        {formatDate(selectedArtifact.created_at)}
                      </div>
                      {selectedArtifact.generator?.engine && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Générateur:</span>{' '}
                          {selectedArtifact.generator.engine}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payload */}
                {selectedArtifact?.payload && (
                  <div>
                    <h4 className="font-semibold mb-2">Contenu</h4>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                      <code>{JSON.stringify(selectedArtifact.payload, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Source artifacts */}
                {selectedArtifact?.source_artifacts?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
                      Sources
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedArtifact.source_artifacts.map((src, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                        >
                          {ARTIFACT_LABELS[src.artifact_type]?.icon || '📦'}{' '}
                          {ARTIFACT_LABELS[src.artifact_type]?.label || src.artifact_type} v
                          {src.version}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtifactsView;
