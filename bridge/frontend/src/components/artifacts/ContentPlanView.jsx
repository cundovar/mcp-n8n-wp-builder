import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function ContentPlanView({ artifact, showRaw = true }) {
  // Meme logique que les autres vues: on lit d'abord le payload metier s'il
  // est encapsule, puis on retombe sur le payload brut.
  const payload = artifact?.payload?.payload || artifact?.payload || {};
  const pages = payload.pages || [];
  const sectionsCount = pages.reduce((sum, page) => sum + (page.sections?.length || 0), 0);

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Pages', value: pages.length },
          { label: 'Sections', value: sectionsCount },
        ]}
      />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Plan de contenu</h4>
        <div className="space-y-3">
          {pages.map((page, index) => (
            <div key={page.slug || index} className="rounded border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-medium">{page.slug || '-'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                SEO title : {page.seo_title || '-'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Meta description : {page.meta_description || '-'}
              </p>
              <div className="mt-3 space-y-2">
                {(page.sections || []).map((section, sectionIndex) => (
                  <div key={section.section_id || sectionIndex} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
                    <p className="text-sm font-medium">{section.section_id || '-'}</p>
                    <p className="text-sm mt-1">{section.copy_goal || '-'}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Blocs: {section.content_blocks?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {pages.length === 0 && <p className="text-sm text-gray-500">Aucun contenu prevu.</p>}
        </div>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default ContentPlanView;
