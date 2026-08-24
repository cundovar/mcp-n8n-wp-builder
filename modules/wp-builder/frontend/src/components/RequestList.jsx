import { getRequestStatus, getStatusConfig } from '../lib/status';
import StatusBadge from './ui/StatusBadge';

function formatDate(dateStr) {
  if (!dateStr) return 'Date inconnue';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function RequestList({
  requests,
  onViewDetail,
  onRefresh,
  onDeleteRequest,
  title = 'Tous les projets',
  emptyTitle = 'Aucun projet',
  emptyDescription = 'Créez votre premier site WordPress.',
}) {
  if (requests.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
        <div aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600 dark:bg-blue-950">+</div>
        <h2 className="mt-4 text-xl font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="projects-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Portfolio WordPress</p>
          <h2 id="projects-heading" className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{requests.length} projet{requests.length > 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={onRefresh} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          Actualiser
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requests.map((request) => {
          const status = getRequestStatus(request);
          const statusInfo = getStatusConfig(status);
          const progress = statusInfo.step ? Math.round((statusInfo.step / 7) * 100) : 0;
          return (
            <article key={request.requestId} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
              <button type="button" onClick={() => onViewDetail(request.requestId)} aria-label={`Ouvrir le projet ${request.input?.site_name || 'Sans nom'}`} className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" />
              <div className="relative pointer-events-none">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{request.input?.site_name || 'Sans nom'}</p>
                    <p className="mt-1 text-sm capitalize text-slate-500">{request.input?.site_type || 'Site vitrine'}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>{statusInfo.step ? `Étape ${statusInfo.step} sur 7` : statusInfo.label}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
                  <span>{formatDate(request.createdAt || request.created_at)}</span>
                  <span className="font-mono">{request.requestId.slice(0, 8)}</span>
                </div>
              </div>

              {onDeleteRequest ? (
                <button type="button" onClick={() => onDeleteRequest(request.requestId)} aria-label={`Supprimer le projet ${request.input?.site_name || 'Sans nom'}`} className="relative z-10 mt-4 w-full rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 opacity-0 transition hover:bg-red-50 focus:opacity-100 group-hover:opacity-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50">
                  Supprimer
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RequestList;
