import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function SiteArchitectureView({ artifact, showRaw = true }) {
  // Les artefacts stockes sont souvent enveloppes dans `payload.payload`.
  const payload = artifact?.payload?.payload || artifact?.payload || {};
  const pages = payload.pages || [];
  const totalSections = pages.reduce((sum, page) => sum + (page.sections?.length || 0), 0);

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Nom du site', value: payload.site_name || '-' },
          { label: 'Type', value: payload.site_type || '-' },
          { label: 'Pages', value: pages.length },
          { label: 'Sections', value: totalSections },
        ]}
      />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Direction design</h4>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Ton</p>
            <p className="font-medium">{payload.design_direction?.tone || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Couleurs</p>
            <p className="font-medium">{payload.design_direction?.colors || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Layout</p>
            <p className="font-medium">{payload.design_direction?.layout || '-'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Pages prevues</h4>
        <div className="space-y-3">
          {pages.length === 0 && <p className="text-sm text-gray-500">Aucune page.</p>}
          {pages.map((page, index) => (
            <div key={page.slug || index} className="rounded border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{page.title || '-'}</p>
                  <p className="text-xs text-gray-500">Slug : {page.slug || '-'}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {page.sections?.length || 0} sections
                </span>
              </div>
              {page.goal && <p className="text-sm mt-2">{page.goal}</p>}
              <div className="mt-3 space-y-2">
                {(page.sections || []).map((section, sectionIndex) => (
                  <div
                    key={`${page.slug || index}-${sectionIndex}`}
                    className="rounded bg-gray-50 dark:bg-gray-900/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{section.title || '-'}</p>
                      <span className="text-xs text-gray-500">{section.type || '-'}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.content_brief || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Notes techniques</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          {(payload.technical_notes || []).map((note, index) => (
            <li key={index}>{note}</li>
          ))}
          {(payload.technical_notes || []).length === 0 && <li>Aucune note technique.</li>}
        </ul>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default SiteArchitectureView;
