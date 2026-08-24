import assert from 'node:assert/strict';
import test from 'node:test';
import { listSiteKits, selectSiteKit } from '../src/core/services/siteKitCatalog.js';

test('catalogue lists normalized candidate kits', () => {
  const kits = listSiteKits({ status: 'candidate' });
  assert.equal(kits.length, 8);
  assert.ok(kits.every((kit) => kit.builder === 'elementor' && kit.license === 'free'));
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

test('apply mode refuses unvalidated candidates', () => {
  const result = selectSiteKit({ execution_mode: 'apply', constraints: {} });
  assert.equal(result.selected, null);
  assert.match(result.reason, /No validated/);
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
