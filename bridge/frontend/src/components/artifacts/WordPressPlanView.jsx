import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function WordPressPlanView({ artifact, showRaw = true }) {
  // Le plan WordPress suit aussi le contrat encapsule `payload.payload`.
  const payload = artifact?.payload?.payload || artifact?.payload || {};
  const pages = payload.pages_to_create || [];
  const menus = payload.menus_to_create || [];
  const plugins = payload.plugins_to_install || [];
  const forms = payload.forms_to_create || [];
  const settings = payload.settings_to_apply || [];
  const seoActions = payload.seo_actions || [];

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Pages', value: pages.length },
          { label: 'Menus', value: menus.length },
          { label: 'Plugins', value: plugins.length },
          { label: 'Formulaires', value: forms.length },
        ]}
      />

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Pages a creer</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {pages.map((page, index) => (
              <li key={page.slug || index}>{page.title || page.slug || '-'}</li>
            ))}
            {pages.length === 0 && <li>Aucune page.</li>}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Plugins</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {plugins.map((plugin, index) => (
              <li key={index}>{plugin}</li>
            ))}
            {plugins.length === 0 && <li>Aucun plugin.</li>}
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Menus</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {menus.map((menu, index) => (
              <li key={menu.name || index}>{menu.name || '-'}</li>
            ))}
            {menus.length === 0 && <li>Aucun menu.</li>}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Formulaires</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {forms.map((form, index) => (
              <li key={form.name || index}>{form.name || '-'}</li>
            ))}
            {forms.length === 0 && <li>Aucun formulaire.</li>}
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Strategie theme</h4>
          <p className="text-sm">{payload.theme_strategy?.summary || payload.theme_strategy?.approach || '-'}</p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Reglages et SEO</h4>
          <p className="text-sm">Reglages: {settings.length}</p>
          <p className="text-sm mt-1">Actions SEO: {seoActions.length}</p>
        </div>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default WordPressPlanView;
