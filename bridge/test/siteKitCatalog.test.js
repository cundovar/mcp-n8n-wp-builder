import assert from 'node:assert/strict';
import test from 'node:test';
import { listSiteKits, resolveSiteKitCatalogEntry, selectSiteKit } from '../src/core/services/siteKitCatalog.js';

test('catalogue separates staging-validated and candidate kits', () => {
  const kits = listSiteKits({ status: 'candidate' });
  assert.equal(kits.length, 7);
  assert.ok(kits.every((kit) => kit.builder === 'elementor' && kit.license === 'free'));
  assert.deepEqual(listSiteKits({ status: 'validated' }).map((kit) => kit.kit_id), ['astra-wellness-coach-02']);
});

test('selection is deterministic and excludes WooCommerce by default', () => {
  const first = selectSiteKit({
    execution_mode: 'dry_run',
    industries: ['agency'],
    page_types: ['home', 'services', 'about', 'contact'],
    features: ['contact_form'],
    constraints: { elementor_level: 'free', woocommerce: false },
  });
  const second = selectSiteKit({
    execution_mode: 'dry_run',
    industries: ['agency'],
    page_types: ['home', 'services', 'about', 'contact'],
    features: ['contact_form'],
    constraints: { elementor_level: 'free', woocommerce: false },
  });
  assert.equal(first.selected.kit_id, 'astra-digital-agency-02');
  assert.deepEqual(first, second);
  assert.equal(first.selected.woocommerce, undefined);
});

test('apply mode selects only a validated candidate', () => {
  const result = selectSiteKit({ execution_mode: 'apply', constraints: {} });
  assert.equal(result.selected.kit_id, 'astra-wellness-coach-02');
});

test('live resolution pins the validated free Elementor template id', () => {
  const kit = listSiteKits({ status: 'validated' })[0];
  const resolved = resolveSiteKitCatalogEntry(kit, [
    { id: 94191, type: 'Free', 'page-builder': 'Elementor', url: '//websitedemos.net/wellness-coach-02' },
  ]);
  assert.equal(resolved.starter_template_id, 94191);
  assert.throws(() => resolveSiteKitCatalogEntry(kit, [
    { id: 99999, type: 'Free', 'page-builder': 'Elementor', url: '//websitedemos.net/wellness-coach-02' },
  ]), /changed live template id/);
});

test('WooCommerce catalogue branch requires explicit permission', () => {
  const denied = selectSiteKit({
    execution_mode: 'dry_run',
    industries: ['ecommerce'],
    page_types: ['shop', 'cart', 'checkout'],
    constraints: { woocommerce: false },
  });
  assert.notEqual(denied.selected.kit_id, 'astra-generic-ecommerce-02');

  const allowed = selectSiteKit({
    execution_mode: 'dry_run',
    industries: ['ecommerce'],
    page_types: ['shop', 'cart', 'checkout'],
    features: ['woocommerce'],
    constraints: { woocommerce: true },
  });
  assert.equal(allowed.selected.kit_id, 'astra-generic-ecommerce-02');
});
