const fs = require('node:fs/promises');

const N8N_URL = process.env.N8N_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_URL || !N8N_API_KEY) {
  throw new Error('Missing N8N_URL or N8N_API_KEY');
}

const workflowIds = [
  'EctXYJ4mDFDKRqLH',
  'L5Wuo55YDPkSmu5K',
  '63D9uoJINYd3QFHd',
];

const BRIDGE_URL = 'http://192.168.1.147:3000';
const N8N_BASE_URL = 'http://localhost:5678';

function patchJsCode(jsCode) {
  return jsCode
    .replace(/\|\| \$env\.BRIDGE_BASE_URL \|\| 'http:\/\/localhost:5678'/g, `|| '${BRIDGE_URL}'`)
    .replace(/\|\| \$env\.BRIDGE_BASE_URL \|\| 'http:\/\/192\.168\.1\.147:3000'/g, `|| '${BRIDGE_URL}'`)
    .replace(/\|\| \$env\.N8N_BASE_URL \|\| 'http:\/\/localhost:5678'/g, `|| '${N8N_BASE_URL}'`);
}

function sanitizeWorkflowForUpdate(workflow) {
  const settings = workflow.settings ?? {};

  return {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: {
      ...(settings.executionOrder ? { executionOrder: settings.executionOrder } : {}),
      ...(settings.callerPolicy ? { callerPolicy: settings.callerPolicy } : {}),
      ...(typeof settings.availableInMCP === 'boolean' ? { availableInMCP: settings.availableInMCP } : {}),
    },
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  for (const workflowId of workflowIds) {
    const workflow = await requestJson(`${N8N_URL}/api/v1/workflows/${workflowId}`);

    for (const node of workflow.nodes || []) {
      if (node.type === 'n8n-nodes-base.code' && node.parameters && typeof node.parameters.jsCode === 'string') {
        node.parameters.jsCode = patchJsCode(node.parameters.jsCode);
      }
    }

    const payload = sanitizeWorkflowForUpdate(workflow);
    await fs.writeFile(`/tmp/${workflowId}.patched.json`, JSON.stringify(payload, null, 2));

    const updated = await requestJson(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    console.log(JSON.stringify({
      workflowId,
      name: updated.name,
      updatedAt: updated.updatedAt,
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
