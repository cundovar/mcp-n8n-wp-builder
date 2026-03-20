function ArtifactSummaryCard({ items = [] }) {
  const visibleItems = items.filter((item) => item && item.label);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {visibleItems.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
        >
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {item.value ?? '-'}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ArtifactSummaryCard;
