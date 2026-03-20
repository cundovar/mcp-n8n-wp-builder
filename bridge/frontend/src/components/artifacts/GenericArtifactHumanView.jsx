import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function formatPrimitive(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (Array.isArray(value)) {
    return `${value.length} element${value.length > 1 ? 's' : ''}`;
  }

  if (typeof value === 'object') {
    return `${Object.keys(value).length} champ${Object.keys(value).length > 1 ? 's' : ''}`;
  }

  return String(value);
}

function renderValue(value, path = 'root') {
  if (value === null || value === undefined || value === '') {
    return <p className="text-sm text-gray-500">-</p>;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="text-sm text-gray-500">Aucun element.</p>;
    }

    return (
      <div className="space-y-2">
        {value.slice(0, 8).map((item, index) => (
          <div
            key={`${path}-${index}`}
            className="rounded border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3"
          >
            {typeof item === 'object' && item !== null ? (
              <div className="space-y-2">
                {Object.entries(item).slice(0, 6).map(([key, nestedValue]) => (
                  <div key={`${path}-${index}-${key}`}>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {key.replace(/_/g, ' ')}
                    </p>
                    {renderValue(nestedValue, `${path}-${index}-${key}`)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200">{String(item)}</p>
            )}
          </div>
        ))}
        {value.length > 8 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {value.length - 8} element(s) supplementaire(s) non affiches.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Object.entries(value).map(([key, nestedValue]) => (
        <section
          key={`${path}-${key}`}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4"
        >
          <h4 className="font-semibold mb-3">{key.replace(/_/g, ' ')}</h4>
          {renderValue(nestedValue, `${path}-${key}`)}
        </section>
      ))}
    </div>
  );
}

function GenericArtifactHumanView({ artifact, showRaw = true }) {
  const payload = artifact?.payload || {};
  const summaryItems = Object.entries(payload)
    .slice(0, 4)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: formatPrimitive(value),
    }));

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard items={summaryItems} />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Resume simplifie</h4>
        {Object.keys(payload).length === 0 ? (
          <p className="text-sm text-gray-500">Aucune donnee exploitable a afficher.</p>
        ) : (
          renderValue(payload)
        )}
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default GenericArtifactHumanView;
