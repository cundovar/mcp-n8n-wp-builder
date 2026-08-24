const VIEWPORTS = [
  { key: 'desktop', label: 'Desktop', dimensions: '1440 × 1200' },
  { key: 'tablet', label: 'Tablette', dimensions: '768 × 1024' },
  { key: 'mobile', label: 'Mobile', dimensions: '390 × 844' },
];

function VisualReviewView({ request }) {
  const stageArtifacts = request.contract?.stage_artifacts || {};
  const review = stageArtifacts.review_result || {};
  const visual = stageArtifacts.visual_manifest || review.visual_manifest || {};
  const captures = Array.isArray(visual.captures) ? visual.captures : [];
  const manifest = Array.isArray(stageArtifacts.build_manifest) ? stageArtifacts.build_manifest : [];
  const pageKeys = [...new Set([...manifest.map((item) => item.artifact_key), ...captures.map((item) => item.page_key)].filter(Boolean))];
  const findings = Array.isArray(review.findings) ? review.findings : [];
  const stagingUrl = request.contract?.target_site?.base_url || request.contract?.target_site?.url || request.result?.site_url;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h3 className="text-xl font-semibold">Revue visuelle</h3><p className="mt-1 text-sm text-slate-500">Contrôle des pages Elementor sur les trois formats obligatoires.</p></div>
        {stagingUrl ? <a href={stagingUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">Ouvrir le staging ↗</a> : null}
      </div>

      <div className={`rounded-xl border p-4 ${review.verdict === 'approve' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40' : review.verdict === 'changes_requested' ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40'}`}>
        <p className="font-semibold">{review.verdict === 'approve' ? 'Revue réussie' : review.verdict === 'changes_requested' ? 'Corrections nécessaires' : 'Revue pas encore disponible'}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.checked_at ? `Dernier contrôle : ${new Date(review.checked_at).toLocaleString('fr-FR')}` : 'Les preuves apparaîtront après la construction et le passage du workflow de revue.'}</p>
      </div>

      {pageKeys.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-4 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/50"><div className="p-3">Page</div>{VIEWPORTS.map((viewport) => <div key={viewport.key} className="p-3 text-center">{viewport.label}</div>)}</div>
          {pageKeys.map((pageKey) => <div key={pageKey} className="grid grid-cols-4 items-center border-t border-slate-200 dark:border-slate-700"><div className="truncate p-3 text-sm font-semibold capitalize">{pageKey.replace(/-/g, ' ')}</div>{VIEWPORTS.map((viewport) => { const capture = captures.find((item) => item.page_key === pageKey && item.viewport === viewport.key); return <div key={viewport.key} className="p-3 text-center"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${capture?.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`} title={`${viewport.label} ${viewport.dimensions}`}>{capture?.ok ? '✓' : '—'}</span></div>; })}</div>)}
        </div>
      ) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><p className="font-semibold">Aucune preuve visuelle enregistrée</p><p className="mt-2 text-sm text-slate-500">La matrice desktop, tablette et mobile sera alimentée automatiquement après le build.</p></div>}

      {findings.length > 0 ? <section><h4 className="mb-3 font-semibold">Points à corriger ({findings.length})</h4><div className="space-y-3">{findings.map((finding, index) => <article key={`${finding.artifact_key}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${finding.severity === 'critical' ? 'bg-red-100 text-red-700' : finding.severity === 'major' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>{finding.severity}</span><span className="text-sm font-semibold capitalize">{finding.artifact_key || 'Site entier'}</span><span className="text-xs text-slate-500">{finding.category}</span></div><p className="mt-3 text-sm">{finding.evidence}</p><p className="mt-2 text-sm text-slate-500"><strong>Correction attendue :</strong> {finding.expected_correction}</p></article>)}</div></section> : null}
    </div>
  );
}

export default VisualReviewView;
