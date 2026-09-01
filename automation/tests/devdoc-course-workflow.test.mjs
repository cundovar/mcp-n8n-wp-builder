import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../workflows/50-devdoc-course-batch.json", import.meta.url);
const workflow = JSON.parse(await readFile(workflowPath, "utf8"));

test("le fichier est importable directement par n8n", () => {
  assert.equal(Array.isArray(workflow), false);
  assert.equal(workflow.id, "DEVDOCCOURSEBATCH01");
  assert.ok(Array.isArray(workflow.nodes));
  assert.equal(typeof workflow.connections, "object");
});

test("le workflow reste inactif et le webhook exige un credential dédié", () => {
  assert.equal(workflow.active, false);
  const webhook = workflow.nodes.find((node) => node.name === "DevDoc Course Batch Webhook");
  assert.equal(webhook.parameters.authentication, "headerAuth");
  assert.equal(webhook.credentials.httpHeaderAuth.name, "DevDoc Course Batch Webhook Token");
  assert.notEqual(webhook.credentials.httpHeaderAuth.id, "TINskEJG2pAFYwcv");
});

test("tous les appels MCP disposent de trois tentatives réseau progressives", () => {
  const requests = workflow.nodes.filter((node) => node.type === "n8n-nodes-base.httpRequest");
  assert.ok(requests.length > 0);
  for (const node of requests) {
    assert.equal(node.retryOnFail, true, `${node.name} doit activer retryOnFail`);
    assert.equal(node.maxTries, 3, `${node.name} doit effectuer trois tentatives`);
    assert.ok(node.waitBetweenTries >= 1000, `${node.name} doit attendre entre les tentatives`);
  }
});
