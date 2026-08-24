import { getRequestStatus, getStatusConfig } from '../lib/status';
import StatusBadge from './ui/StatusBadge';

const TABS = [
  { key: 'detail', label: 'Vue d’ensemble' },
  { key: 'pipeline', label: 'Plan & pipeline' },
  { key: 'artifacts', label: 'Artefacts' },
  { key: 'visual', label: 'Revue visuelle' },
  { key: 'execution', label: 'Exécution' },
];

function ProjectWorkspace({ request, activeView, onNavigate, onBack, children }) {
  const status = getRequestStatus(request);
  const statusInfo = getStatusConfig(status);
  const step = statusInfo.step || 0;

  return (
    <section>
      <button type="button" onClick={onBack} className="mb-4 text-sm font-semibold text-slate-500 hover:text-blue-600 focus:outline-none focus:underline">← Tous les projets</button>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-bold tracking-tight">{request.input?.site_name || 'Sans nom'}</h2>
                <StatusBadge status={status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{request.input?.site_type || 'Site vitrine'} · <span className="font-mono">{request.requestId.slice(0, 8)}</span></p>
            </div>
            {statusInfo.action ? <button type="button" onClick={() => onNavigate(status === 'waiting_validation' ? 'validation' : status === 'failed' ? 'execution' : 'visual')} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">Action requise</button> : null}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-slate-500"><span>{step ? `Étape ${step} sur 7` : statusInfo.label}</span><span>{step ? Math.round((step / 7) * 100) : 0}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${step ? (step / 7) * 100 : 0}%` }} /></div>
          </div>
        </header>

        <nav aria-label="Sections du projet" className="flex overflow-x-auto border-b border-slate-200 px-3 dark:border-slate-800 sm:px-5">
          {TABS.map((tab) => {
            const active = activeView === tab.key || (tab.key === 'detail' && activeView === 'validation');
            return <button key={tab.key} type="button" onClick={() => onNavigate(tab.key)} aria-current={active ? 'page' : undefined} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${active ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{tab.label}</button>;
          })}
        </nav>

        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </section>
  );
}

export default ProjectWorkspace;
