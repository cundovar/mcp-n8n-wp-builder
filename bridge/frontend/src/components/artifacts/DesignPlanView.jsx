import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function stringifyValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return Object.values(value).join(', ');
  return value || '-';
}

function DesignPlanView({ artifact, showRaw = true }) {
  // Le schema actuel de `design_plan` expose surtout `brand_direction`
  // et `component_guidelines`, pas `components` comme dans l'ancien format.
  const payload = artifact?.payload?.payload || artifact?.payload || {};
  const brandDirection = payload.brand_direction || {};
  const palette = Array.isArray(brandDirection.palette) ? brandDirection.palette : [];
  const typeScale = brandDirection.type_scale || {};
  const componentGuidelines = Array.isArray(payload.component_guidelines)
    ? payload.component_guidelines
    : [];
  const spacingKeys = Object.keys(payload.spacing || {});
  const imagerySources = Array.isArray(payload.imagery?.sources) ? payload.imagery.sources : [];

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Ton', value: brandDirection.tone || payload.tone || payload.style || '-' },
          { label: 'Palette', value: palette.length },
          { label: 'Composants', value: componentGuidelines.length },
          { label: 'Espacements', value: spacingKeys.length },
        ]}
      />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Intentions visuelles</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Palette</p>
            <div className="space-y-2">
              {palette.length === 0 && <p className="font-medium">-</p>}
              {palette.map((color, index) => (
                <div key={color.name || index} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
                  <p className="font-medium">{color.name || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {color.value || '-'}{color.usage ? ` · ${color.usage}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Typographie</p>
            <p className="font-medium">
              {stringifyValue({
                heading_font: typeScale.heading_font,
                body_font: typeScale.body_font,
                base_size: typeScale.base_size,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ratio: {typeScale.scale_ratio || '-'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Composants</h4>
        <div className="space-y-2">
          {componentGuidelines.length === 0 && (
            <p className="text-sm text-gray-500">Aucun composant detaille.</p>
          )}
          {componentGuidelines.map((item, index) => (
            <div key={item.component || index} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
              <p className="text-sm font-medium">{item.component || '-'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {item.guidelines || '-'}
              </p>
              {item.examples?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Exemples: {item.examples.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Principes de layout</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(brandDirection.layout_principles || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
            {(brandDirection.layout_principles || []).length === 0 && <li>Aucun principe detaille.</li>}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Imagerie</h4>
          <p className="text-sm font-medium">{payload.imagery?.style || '-'}</p>
          <p className="text-xs text-gray-500 mt-2">
            Sources: {imagerySources.length > 0 ? imagerySources.join(', ') : '-'}
          </p>
        </div>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default DesignPlanView;
