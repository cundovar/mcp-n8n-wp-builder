import assert from 'node:assert/strict';
import test from 'node:test';

import { REQUIRED_BUILD_ARTIFACTS, verifyApprovedArtifacts } from '../services/artifact-approval.js';

test('accepts exactly the pinned validated artifact versions', async () => {
  const versions = Object.fromEntries(REQUIRED_BUILD_ARTIFACTS.map((type, index) => [type, index + 1]));
  const seen = [];
  const result = await verifyApprovedArtifacts('req-1', versions, async (requestId, type, version) => {
    seen.push([requestId, type, version]);
    return { status: 'validated', payload: { type, version } };
  });

  assert.deepEqual(result.errors, []);
  assert.equal(Object.keys(result.artifacts).length, REQUIRED_BUILD_ARTIFACTS.length);
  assert.deepEqual(seen[0], ['req-1', 'site_architecture', 1]);
});

test('reports missing, stale and unvalidated pinned versions', async () => {
  const versions = Object.fromEntries(REQUIRED_BUILD_ARTIFACTS.map((type) => [type, 1]));
  delete versions.content_plan;
  const result = await verifyApprovedArtifacts('req-2', versions, async (_requestId, type) => {
    if (type === 'design_plan') return null;
    if (type === 'wordpress_plan') return { status: 'generated', payload: {} };
    return { status: 'validated', payload: {} };
  });

  assert.deepEqual(result.errors, [
    'content_plan: approved version missing',
    'design_plan: version 1 not found',
    'wordpress_plan: version 1 is generated, not validated',
  ]);
});
