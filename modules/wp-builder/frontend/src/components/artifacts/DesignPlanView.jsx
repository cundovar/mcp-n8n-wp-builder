import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function stringifyValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return Object.values(value).join(', ');
  return value || '-';
}

function KeyValueList({ items }) {
  const entries = Object.entries(items || {}).filter(([, value]) => value);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">-</p>;
  }

  return (
    <dl className="grid gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">{key}</dt>
          <dd className="font-medium text-right">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DesignPlanView({ artifact, showRaw = true }) {
  const payload = artifact?.payload?.payload || artifact?.payload || {};
  const brandDirection = payload.brand_direction || {};
  const palette = Array.isArray(brandDirection.palette) ? brandDirection.palette : [];
  const typeScale = brandDirection.type_scale || {};
  const componentGuidelines = Array.isArray(payload.component_guidelines)
    ? payload.component_guidelines
    : [];
  const spacingSystem = payload.spacing_system || payload.spacing || {};
  const spacingKeys = Object.keys(spacingSystem || {});
  const imagerySources = Array.isArray(payload.imagery?.sources) ? payload.imagery.sources : [];
  const imagerySubjects = Array.isArray(payload.imagery?.subjects) ? payload.imagery.subjects : [];
  const imageryAvoid = Array.isArray(payload.imagery?.avoid) ? payload.imagery.avoid : [];
  const assumptions = Array.isArray(payload.design_assumptions) ? payload.design_assumptions : [];
  const elementor = payload.elementor_guidelines || {};
  const globalColors = Array.isArray(elementor.global_colors) ? elementor.global_colors : [];
  const globalFonts = Array.isArray(elementor.global_fonts) ? elementor.global_fonts : [];
  const sectionPatterns = Array.isArray(elementor.section_patterns) ? elementor.section_patterns : [];
  const cssVariables = Array.isArray(elementor.astra_child_variables?.css_variables)
    ? elementor.astra_child_variables.css_variables
    : [];

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Ton', value: brandDirection.tone || payload.tone || payload.style || '-' },
          { label: 'Palette', value: palette.length },
          { label: 'Composants', value: componentGuidelines.length },
          { label: 'Espacements', value: spacingKeys.length },
          { label: 'Elementor', value: globalColors.length + globalFonts.length + sectionPatterns.length },
        ]}
      />

      {assumptions.length > 0 && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Hypotheses design</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

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
            <p className="text-gray-500 dark:text-gray-400">Positionnement</p>
            <p className="font-medium mb-4">
              {brandDirection.visual_positioning || brandDirection.tone || '-'}
            </p>
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
            <div className="mt-3">
              <KeyValueList items={typeScale.computed_scale} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Spacing</h4>
          <KeyValueList
            items={{
              base_unit: spacingSystem.base_unit,
              container: spacingSystem.container_max_width,
              column_gap: spacingSystem.column_gap,
              desktop: spacingSystem.section_padding?.desktop,
              tablet: spacingSystem.section_padding?.tablet,
              mobile: spacingSystem.section_padding?.mobile,
            }}
          />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Rayons</h4>
          <KeyValueList items={brandDirection.border_radius} />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Ombres</h4>
          <KeyValueList items={brandDirection.shadows} />
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
              {(item.elementor_widget || item.layout || item.interaction) && (
                <div className="grid md:grid-cols-3 gap-2 text-xs text-gray-500 mt-3">
                  <p>Widget: {item.elementor_widget || '-'}</p>
                  <p>Layout: {item.layout || '-'}</p>
                  <p>Interaction: {item.interaction || '-'}</p>
                </div>
              )}
              {item.examples?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Exemples: {item.examples.join(', ')}
                </p>
              )}
              {item.avoid?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Eviter: {item.avoid.join(', ')}
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
          <p className="text-xs text-gray-500 mt-2">
            Sujets: {imagerySubjects.length > 0 ? imagerySubjects.join(', ') : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Traitement: {payload.imagery?.color_treatment || '-'}
          </p>
          {imageryAvoid.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Eviter: {imageryAvoid.join(', ')}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Elementor et Astra child</h4>
        <div className="grid lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Global colors</p>
            <div className="space-y-1">
              {globalColors.length === 0 && <p className="text-gray-500">-</p>}
              {globalColors.map((item, index) => (
                <p key={item.title || index} className="font-medium">
                  {item.title || '-'} <span className="text-gray-500">{item.color || '-'}</span>
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Global fonts</p>
            <div className="space-y-1">
              {globalFonts.length === 0 && <p className="text-gray-500">-</p>}
              {globalFonts.map((item, index) => (
                <p key={item.title || index} className="font-medium">
                  {item.title || '-'} <span className="text-gray-500">{item.font_family || '-'}</span>
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Variables CSS</p>
            <div className="space-y-1">
              {cssVariables.length === 0 && <p className="text-gray-500">-</p>}
              {cssVariables.map((item, index) => (
                <p key={item.variable || index} className="font-medium">
                  {item.variable || '-'} <span className="text-gray-500">{item.value || '-'}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {sectionPatterns.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Patterns de sections</p>
            <div className="grid md:grid-cols-2 gap-2">
              {sectionPatterns.map((item, index) => (
                <div key={item.pattern_name || index} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
                  <p className="text-sm font-medium">{item.pattern_name || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.structure || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pages: {item.used_on_pages?.length ? item.used_on_pages.join(', ') : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default DesignPlanView;
