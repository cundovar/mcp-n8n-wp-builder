function GenericArtifactJsonView({ artifact, title = 'JSON brut' }) {
  return (
    <details className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
        {title}
      </summary>
      <div className="border-t border-gray-200 dark:border-gray-600 p-4">
        <pre className="rounded bg-gray-900 p-3 text-xs text-gray-100 overflow-auto max-h-96">
          <code>{JSON.stringify(artifact?.payload ?? artifact, null, 2)}</code>
        </pre>
      </div>
    </details>
  );
}

export default GenericArtifactJsonView;
