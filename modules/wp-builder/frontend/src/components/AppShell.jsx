const NAV_ITEMS = [
  { key: 'list', label: 'Projets', symbol: 'P' },
  { key: 'validations', label: 'Validations', symbol: 'V' },
  { key: 'form', label: 'Nouveau site', symbol: '+' },
];

function AppShell({ view, requestCount, validationCount, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:border-slate-800">
          <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">WP Builder</p>
              <h1 className="mt-1 text-lg font-semibold">Studio de création</h1>
            </div>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">Staging</span>
          </div>

          <nav aria-label="Navigation principale" className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3">
            {NAV_ITEMS.map((item) => {
              const active = view === item.key || (item.key === 'list' && !['form', 'validations'].includes(view));
              const count = item.key === 'list' ? requestCount : item.key === 'validations' ? validationCount : null;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                  <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs font-bold">{item.symbol}</span>
                  <span>{item.label}</span>
                  {count !== null ? <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="hidden px-6 py-5 text-xs leading-5 text-slate-500 lg:absolute lg:bottom-0 lg:block lg:w-64">
            Astra + Elementor<br />Publication sous contrôle humain
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Espace de travail</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Construire, contrôler et valider chaque site.</p>
              </div>
              <button type="button" onClick={() => onNavigate('form')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Nouveau site
              </button>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
