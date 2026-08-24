function FeedbackBanner({ tone = 'error', children, onRetry, onDismiss }) {
  const styles = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200';

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p>{children}</p>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry ? (
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
            Réessayer
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" onClick={onDismiss} aria-label="Fermer le message" className="rounded px-1 font-bold">
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default FeedbackBanner;
