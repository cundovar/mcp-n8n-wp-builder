import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_STYLES = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    icon: '⏳',
    label: 'En attente',
  },
  running: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '⚙️',
    label: 'En cours',
    animate: true,
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: '✅',
    label: 'Terminé',
  },
  failed: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: '❌',
    label: 'Échec',
  },
  failed_partial: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: '⚠️',
    label: 'Échec partiel',
  },
  compensating: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '🔄',
    label: 'Compensation en cours',
    animate: true,
  },
  compensated: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '↩️',
    label: 'Compensé',
  },
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    icon: '🚫',
    label: 'Annulé',
  },
  manual_intervention_required: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: '🚨',
    label: 'Intervention manuelle requise',
  },
  skipped: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-500 dark:text-gray-500',
    icon: '⏭️',
    label: 'Ignoré',
  },
};

const LOG_LEVEL_STYLES = {
  debug: 'text-gray-500 dark:text-gray-500',
  info: 'text-blue-600 dark:text-blue-400',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
};

const LOG_LEVEL_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function ExecutionView({ request, onBack }) {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [logFilter, setLogFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef(null);

  // Charger les exécutions
  useEffect(() => {
    const fetchExecutions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/requests/${request.requestId}/executions`);
        const data = await res.json();
        const executionsList = data.executions || [];
        setExecutions(executionsList);

        // Sélectionner la plus récente par défaut
        if (executionsList.length > 0 && !selectedExecution) {
          setSelectedExecution(executionsList[0]);
        }
      } catch (err) {
        console.error('Erreur chargement exécutions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();

    // Polling pour les mises à jour si une exécution est en cours
    const interval = setInterval(fetchExecutions, 3000);
    return () => clearInterval(interval);
  }, [request.requestId]);

  // Auto-scroll des logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedExecution?.logs, autoScroll]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (start, end) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate - startDate;
    const diffSec = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getProgress = () => {
    if (!selectedExecution?.progress) return 0;
    const { total_steps, completed_steps } = selectedExecution.progress;
    if (!total_steps) return 0;
    return Math.round((completed_steps / total_steps) * 100);
  };

  const filteredLogs = selectedExecution?.logs?.filter((log) => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  }) || [];

  const statusStyle = STATUS_STYLES[selectedExecution?.status] || STATUS_STYLES.pending;

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
        <h2 className="text-2xl font-bold mb-1">Exécution WordPress</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {request.input?.site_name || 'Sans nom'} • {executions.length} exécution
          {executions.length > 1 ? 's' : ''}
        </p>
      </div>

      {loading && !selectedExecution && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2 animate-spin">⚙️</div>
          <p>Chargement des exécutions...</p>
        </div>
      )}

      {!loading && executions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🚀</div>
          <p>Aucune exécution pour cette demande</p>
          <p className="text-sm mt-1">L'exécution démarrera après la validation du plan.</p>
        </div>
      )}

      {executions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Liste des exécutions */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase mb-3">
              Exécutions
            </h3>
            {executions.map((exec) => {
              const style = STATUS_STYLES[exec.status] || STATUS_STYLES.pending;
              const isSelected = selectedExecution?.execution_id === exec.execution_id;

              return (
                <button
                  key={exec.execution_id}
                  onClick={() => setSelectedExecution(exec)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={style.animate ? 'animate-spin' : ''}>{style.icon}</span>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm truncate">
                        {exec.execution_id.slice(0, 12)}...
                      </p>
                      <p className="text-xs text-gray-500">{exec.mode === 'apply' ? 'Production' : 'Dry-run'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Détail de l'exécution */}
          <div className="md:col-span-3">
            {selectedExecution && (
              <div className="space-y-4">
                {/* Status banner */}
                <div className={`p-4 rounded-lg ${statusStyle.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${statusStyle.animate ? 'animate-spin' : ''}`}>
                        {statusStyle.icon}
                      </span>
                      <div>
                        <p className={`font-semibold ${statusStyle.text}`}>{statusStyle.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Mode: {selectedExecution.mode === 'apply' ? 'Production' : 'Dry-run'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>Démarré: {formatDate(selectedExecution.started_at)}</p>
                      <p>
                        Durée: {formatDuration(selectedExecution.started_at, selectedExecution.completed_at)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {['running', 'compensating'].includes(selectedExecution.status) && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{selectedExecution.progress?.current_step || 'Initialisation...'}</span>
                        <span>{getProgress()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getProgress()}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                {selectedExecution.steps?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Étapes</h3>
                    <div className="space-y-2">
                      {selectedExecution.steps.map((step, index) => {
                        const stepStyle = STATUS_STYLES[step.status] || STATUS_STYLES.pending;

                        return (
                          <div
                            key={step.step_key || index}
                            className={`flex items-center gap-3 p-3 rounded-lg ${stepStyle.bg}`}
                          >
                            <span className={stepStyle.animate ? 'animate-spin' : ''}>
                              {stepStyle.icon}
                            </span>
                            <div className="flex-grow">
                              <p className={`font-medium text-sm ${stepStyle.text}`}>
                                {step.label || step.step_key}
                              </p>
                              {step.details && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {typeof step.details === 'string'
                                    ? step.details
                                    : JSON.stringify(step.details)}
                                </p>
                              )}
                            </div>
                            {step.completed_at && (
                              <span className="text-xs text-gray-500">
                                {formatDuration(step.started_at, step.completed_at)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Logs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Logs</h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.target.checked)}
                          className="rounded"
                        />
                        Auto-scroll
                      </label>
                      <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      >
                        <option value="all">Tous</option>
                        <option value="error">Erreurs</option>
                        <option value="warn">Warnings</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-sm">
                    {filteredLogs.length === 0 ? (
                      <p className="text-gray-500">Aucun log disponible</p>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <div key={index} className="flex gap-2 mb-1">
                          <span className="text-gray-500 select-none shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                          <span className="shrink-0">{LOG_LEVEL_ICONS[log.level] || 'ℹ️'}</span>
                          <span className={LOG_LEVEL_STYLES[log.level] || 'text-gray-300'}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Result */}
                {selectedExecution.result && (
                  <div
                    className={`p-4 rounded-lg border ${
                      selectedExecution.result.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <h3 className="font-semibold mb-3">
                      {selectedExecution.result.success ? '✅ Résultat' : '❌ Erreur'}
                    </h3>

                    {selectedExecution.result.success ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedExecution.result.site_url && (
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">URL du site:</span>{' '}
                            <a
                              href={selectedExecution.result.site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedExecution.result.site_url}
                            </a>
                          </div>
                        )}
                        {selectedExecution.result.pages_created !== undefined && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Pages créées:</span>{' '}
                            <span className="font-medium">{selectedExecution.result.pages_created}</span>
                          </div>
                        )}
                        {selectedExecution.result.plugins_installed !== undefined && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Plugins installés:</span>{' '}
                            <span className="font-medium">{selectedExecution.result.plugins_installed}</span>
                          </div>
                        )}
                        {selectedExecution.result.summary && (
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Résumé:</span>
                            <p className="mt-1">{selectedExecution.result.summary}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-red-700 dark:text-red-300">
                          {selectedExecution.result.error || 'Une erreur est survenue'}
                        </p>
                        {selectedExecution.result.error_details && (
                          <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedExecution.result.error_details, null, 2)}
                          </pre>
                        )}
                        {selectedExecution.result.next_action && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Action recommandée:{' '}
                            <span className="font-medium">{selectedExecution.result.next_action}</span>
                          </p>
                        )}
                      </div>
                    )}
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

export default ExecutionView;
