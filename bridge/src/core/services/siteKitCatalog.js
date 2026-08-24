import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CATALOG = path.resolve(__dirname, '../../../../automation/catalogs/astra-starter-kits.json');

function normalizeList(values) {
  return Array.isArray(values)
    ? [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
    : [];
}

export function loadSiteKitCatalog(catalogPath = DEFAULT_CATALOG) {
  const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  if (!parsed || !Array.isArray(parsed.kits)) {
    throw new Error('Invalid Astra site-kit catalogue');
  }
  return parsed.kits.map((kit) => ({ ...kit }));
}

export function listSiteKits({ status, catalogPath } = {}) {
  const kits = loadSiteKitCatalog(catalogPath);
  return status ? kits.filter((kit) => kit.status === status) : kits;
}

export function selectSiteKit(input, { catalogPath } = {}) {
  const mode = input?.execution_mode === 'apply' ? 'apply' : 'dry_run';
  const constraints = input?.constraints || {};
  const wantedIndustries = normalizeList(input?.industries);
  const wantedPages = normalizeList(input?.page_types);
  const wantedFeatures = normalizeList(input?.features);
  const allowWooCommerce = constraints.woocommerce === true;
  const elementorLevel = constraints.elementor_level === 'pro' ? 'pro' : 'free';

  const eligible = loadSiteKitCatalog(catalogPath).filter((kit) => {
    if (kit.builder !== 'elementor' || kit.license !== 'free') return false;
    if (mode === 'apply' && kit.status !== 'validated') return false;
    if (kit.woocommerce === true && !allowWooCommerce) return false;
    if (elementorLevel === 'free' && normalizeList(kit.requires).some((item) => item.includes('elementor-pro'))) return false;
    return true;
  });

  const scored = eligible.map((kit) => {
    const industries = normalizeList(kit.industries);
    const pages = normalizeList(kit.page_types);
    const features = normalizeList(kit.features);
    const requirements = normalizeList(kit.requires);
    const industryScore = wantedIndustries.length === 0 ? 0 : Math.round(30 * wantedIndustries.filter((v) => industries.includes(v)).length / wantedIndustries.length);
    const pageScore = wantedPages.length === 0 ? 30 : Math.round(30 * wantedPages.filter((v) => pages.includes(v)).length / wantedPages.length);
    const featureScore = wantedFeatures.length === 0 ? 15 : Math.round(15 * wantedFeatures.filter((v) => features.includes(v)).length / wantedFeatures.length);
    const designScore = kit.builder === 'elementor' ? 15 : 0;
    const dependencyScore = Math.max(0, 10 - Math.max(0, requirements.length - 2) * 2);
    const score = industryScore + pageScore + featureScore + designScore + dependencyScore;
    return {
      ...kit,
      score,
      missing_pages: wantedPages.filter((page) => !pages.includes(page)),
      reasons: [
        `${industryScore}/30 industry match`,
        `${pageScore}/30 page coverage`,
        `${featureScore}/15 feature coverage`,
        `${dependencyScore}/10 dependency simplicity`,
      ],
    };
  }).sort((a, b) => b.score - a.score || a.kit_id.localeCompare(b.kit_id));

  if (scored.length === 0) {
    return {
      selected: null,
      fallback_kit_id: null,
      reason: mode === 'apply'
        ? 'No validated free Elementor kit satisfies the constraints'
        : 'No candidate kit satisfies the constraints',
    };
  }

  const [selected, fallback] = scored;
  return {
    selected,
    fallback_kit_id: fallback?.kit_id || null,
  };
}
