import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function readWorkflow(name) {
  const url = new URL(`../../automation/workflows/${name}`, import.meta.url);
  const parsed = JSON.parse(fs.readFileSync(url, 'utf8'));
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function assertWorkflowStructure(workflow) {
  const names = new Set(workflow.nodes.map((node) => node.name));
  for (const node of workflow.nodes.filter((candidate) => candidate.type === 'n8n-nodes-base.code')) {
    assert.doesNotThrow(() => new Function(node.parameters.jsCode), `${node.name} contains invalid JavaScript`);
  }
  for (const [source, connection] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `connection source is missing: ${source}`);
    for (const output of connection.main || []) {
      for (const edge of output || []) assert.ok(names.has(edge.node), `connection target is missing: ${edge.node}`);
    }
  }
}

test('infrastructure workflow resolves a validated live kit before import', () => {
  const workflow = readWorkflow('10-wordpress-infrastructure.json');
  assertWorkflowStructure(workflow);
  assert.equal(workflow.connections['IF Ready For Staging'].main[0][0].node, 'Resolve Validated Site Kit');
  const actions = workflow.nodes.find((node) => node.name === 'Build Deterministic Infrastructure Actions').parameters.jsCode;
  assert.match(actions, /backup_site_build/);
  assert.match(actions, /import_starter_template/);
  assert.ok(actions.indexOf('import_starter_template') < actions.indexOf('ensure_astra_child_theme'));
});

test('builder workflow mutates Elementor documents without legacy HTML upsert', () => {
  const workflow = readWorkflow('20-wordpress-builder.json');
  assertWorkflowStructure(workflow);
  const serialized = JSON.stringify(workflow);
  assert.doesNotMatch(serialized, /upsert_post/);
  for (const tool of ['apply_elementor_design_system', 'ensure_pages_and_menu', 'get_elementor_document', 'replace_kit_content', 'inspect_elementor_build', 'regenerate_elementor_css']) {
    assert.match(serialized, new RegExp(tool));
  }
  assert.match(serialized, /approved_artifacts/);
  assert.match(serialized, /publish=false/);
});
