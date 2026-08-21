const fs = require('node:fs/promises');
const path = require('node:path');

const WORKFLOW_IDS = [
  'EctXYJ4mDFDKRqLH',
  '63D9uoJINYd3QFHd',
];

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

async function requestJson(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-N8N-API-KEY': apiKey,
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

function getNode(workflow, name) {
  const node = workflow.nodes.find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Missing node "${name}" in workflow "${workflow.name}"`);
  }
  return node;
}

function upsertNode(workflow, node) {
  const index = workflow.nodes.findIndex((candidate) => candidate.name === node.name);
  if (index === -1) {
    workflow.nodes.push(node);
    return;
  }

  workflow.nodes[index] = {
    ...workflow.nodes[index],
    ...node,
    id: workflow.nodes[index].id || node.id,
  };
}

function prepareDesignPlanPromptCode(workflowName) {
  return `const normalized = $('Build normalized_brief').first().json.artifact;
const discovery = $('Build discovery_brief').first().json.artifact;
const siteArchitecture = $('Build site_architecture').first().json.artifact;
const storedSiteArchitecture = $('Bridge - Store site_architecture').first().json;
const siteArchitectureVersion = storedSiteArchitecture.version || storedSiteArchitecture.artifact?.version || storedSiteArchitecture.data?.version || 1;

const prompt = \`Tu es un Directeur Artistique senior specialise WordPress / Astra / Elementor.

MISSION : Analyser le brief client et produire un design_plan JSON pret a l'emploi pour un workflow de generation automatique de site WordPress.

STACK OBLIGATOIRE : WordPress + Astra parent theme + Astra child theme + Elementor page builder.

ENTREES :
normalized_brief :
\${JSON.stringify(normalized.payload, null, 2)}

discovery_brief :
\${JSON.stringify(discovery.payload, null, 2)}

site_architecture :
\${JSON.stringify(siteArchitecture.payload, null, 2)}

REGLES DE SORTIE NON NEGOCIABLES :
1. Reponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou apres. Aucun markdown.
2. Toutes les valeurs doivent etre concretes et exploitables : hex pour les couleurs, noms Google Fonts exacts ou polices systeme, valeurs CSS avec unites.
3. Pas de valeur generique comme "moderne", "professionnel" ou "adapte" sans decision precise.
4. La palette doit contenir 5 a 7 couleurs maximum avec un usage precis par couleur.
5. Les composants majeurs des pages et sections doivent avoir une entree dans component_guidelines ou section_patterns.
6. Si une information manque, fais une hypothese raisonnee et documente-la dans design_assumptions.

SCHEMA JSON ATTENDU :
{
  "design_assumptions": ["string"],
  "brand_direction": {
    "tone": "string",
    "visual_positioning": "string",
    "palette": [{ "name": "string", "value": "#RRGGBB", "usage": "string" }],
    "type_scale": {
      "heading_font": "string",
      "heading_weights": [700],
      "body_font": "string",
      "body_weight": 400,
      "base_size": "string",
      "scale_ratio": 1.25,
      "computed_scale": { "h1": "string", "h2": "string", "h3": "string", "h4": "string", "body": "string", "small": "string" }
    },
    "layout_principles": ["string"],
    "border_radius": { "base": "string", "small": "string", "large": "string", "pill": "string" },
    "shadows": { "sm": "string", "md": "string", "lg": "string" }
  },
  "spacing_system": {
    "base_unit": "string",
    "scale": { "xs": "string", "sm": "string", "md": "string", "lg": "string", "xl": "string", "2xl": "string" },
    "section_padding": { "desktop": "string", "tablet": "string", "mobile": "string" },
    "container_max_width": "string",
    "column_gap": "string"
  },
  "component_guidelines": [{
    "component": "string",
    "elementor_widget": "string",
    "layout": "string",
    "styling": { "background": "string", "padding": "string", "typography": "string" },
    "interaction": "string",
    "guidelines": "string",
    "avoid": ["string"]
  }],
  "imagery": {
    "style": "string",
    "color_treatment": "string",
    "subjects": ["string"],
    "aspect_ratios": { "hero": "string", "card": "string", "avatar": "string" },
    "avoid": ["string"]
  },
  "elementor_guidelines": {
    "global_colors": [{ "title": "string", "color": "#RRGGBB" }],
    "global_fonts": [{ "title": "string", "font_family": "string", "font_weight": "string", "font_size": { "desktop": "string", "tablet": "string", "mobile": "string" } }],
    "section_patterns": [{ "pattern_name": "string", "structure": "string", "used_on_pages": ["string"] }],
    "astra_child_variables": {
      "description": "string",
      "css_variables": [{ "variable": "string", "value": "string" }]
    }
  }
}\`;

return [{ json: {
  request_id: siteArchitecture.request_id,
  bridge_base_url: $('Build site_architecture').first().json.bridge_base_url,
  artifact_type: 'design_plan',
  normalized_artifact: normalized,
  discovery_artifact: discovery,
  site_architecture_artifact: siteArchitecture,
  site_architecture_version: siteArchitectureVersion,
  prompt
}}];`;
}

function buildDesignPlanWrapperCode(workflowName) {
  return `const prepared = $('Prepare design_plan prompt').first().json;
const rawPayload = $json.parsed_json || $json.design_plan || $json;
const payload = rawPayload.payload?.brand_direction ? rawPayload.payload : rawPayload;

if (!payload.brand_direction) {
  throw new Error('design_plan agent output missing brand_direction');
}

return [{ json: {
  request_id: prepared.request_id,
  artifact_type: 'design_plan',
  artifact: {
    contract_version: '1.0',
    request_id: prepared.request_id,
    stage: 'design_plan',
    payload
  },
  bridge_base_url: prepared.bridge_base_url,
  source_artifacts: [
    {
      artifact_type: 'site_architecture',
      version: prepared.site_architecture_version
    }
  ],
  generator: {
    workflow: '${workflowName}',
    stage: 'design_plan',
    execution_id: $execution.id,
    source_stage: 'site_architecture',
    engine: 'codex'
  }
}}];`;
}

function buildWordpressPlanCode(workflowName) {
  return `const contentPlan = $('Build content_plan').first().json.artifact;
const designPlan = $('Build design_plan').first().json.artifact;
const storedContentPlan = $('Bridge - Store content_plan').first().json;
const storedDesignPlan = $('Bridge - Store design_plan').first().json;
const contentPlanVersion = storedContentPlan.version || storedContentPlan.artifact?.version || storedContentPlan.data?.version || 1;
const designPlanVersion = storedDesignPlan.version || storedDesignPlan.artifact?.version || storedDesignPlan.data?.version || 1;

const designPayload = designPlan.payload || {};
const brandDirection = designPayload.brand_direction || {};
const elementorGuidelines = designPayload.elementor_guidelines || {};

const pagesToCreate = contentPlan.payload.pages.map((page) => ({
  slug: page.slug,
  title: page.seo_title.split('|')[0].trim(),
  template: 'default',
  seo_title: page.seo_title
}));

const menuItems = pagesToCreate.map((page) => ({
  label: page.title,
  target_slug: page.slug
}));

const hasContact = pagesToCreate.some((page) => page.slug.includes('contact'));

return [{ json: {
  request_id: contentPlan.request_id,
  artifact_type: 'wordpress_plan',
  artifact: {
    contract_version: '1.0',
    request_id: contentPlan.request_id,
    stage: 'wordpress_plan',
    payload: {
      pages_to_create: pagesToCreate,
      menus_to_create: [
        {
          name: 'Primary',
          location: 'primary',
          items: menuItems
        }
      ],
      plugins_to_install: [
        'elementor',
        'wordpress-seo',
        'contact-form-7',
        'duplicate-post',
        'safe-svg',
        'wp-mail-smtp'
      ],
      theme_strategy: {
        mode: 'astra-child-elementor',
        parent_theme: 'astra',
        child_theme: {
          required: true,
          name: 'astra-child',
          slug: 'astra-child',
          activate: true
        },
        page_builder: 'elementor',
        preferred_palette: brandDirection.palette || [],
        layout_principles: brandDirection.layout_principles || [],
        spacing_system: designPayload.spacing_system || designPayload.spacing || {},
        elementor_globals: {
          colors: elementorGuidelines.global_colors || [],
          fonts: elementorGuidelines.global_fonts || []
        },
        section_patterns: elementorGuidelines.section_patterns || [],
        astra_child_variables: elementorGuidelines.astra_child_variables || {},
        component_guidelines: designPayload.component_guidelines || [],
        imagery: designPayload.imagery || {}
      },
      settings_to_apply: [
        { key: 'blog_public', value: '0' },
        { key: 'permalink_structure', value: '/%postname%/' },
        { key: 'timezone_string', value: 'Europe/Paris' }
      ],
      forms_to_create: hasContact ? [
        {
          name: 'Contact',
          target_page: 'contact',
          fields: ['name', 'email', 'message']
        }
      ] : [],
      seo_actions: contentPlan.payload.pages.map((page) => ({
        slug: page.slug,
        seo_title: page.seo_title,
        meta_description: page.meta_description
      }))
    }
  },
  bridge_base_url: $('Build content_plan').first().json.bridge_base_url,
  source_artifacts: [
    { artifact_type: 'content_plan', version: contentPlanVersion },
    { artifact_type: 'design_plan', version: designPlanVersion }
  ],
  generator: {
    workflow: '${workflowName}',
    stage: 'wordpress_plan',
    execution_id: $execution.id,
    source_stage: 'content_plan+design_plan'
  }
}}];`;
}

function patchNormalizedBriefNode(workflow) {
  const buildNormalizedBrief = getNode(workflow, 'Build normalized_brief');

  buildNormalizedBrief.parameters.jsCode = buildNormalizedBrief.parameters.jsCode
    .replace(
      'const input = $json.body ?? $json;',
      `const envelope = $json.body ?? $json;
const input = envelope.payload && typeof envelope.payload === 'object'
  ? {
      ...envelope.payload,
      request_id: envelope.request_id || envelope.requestId || envelope.payload.request_id || envelope.payload.requestId,
      bridge_base_url: envelope.bridge_base_url || envelope.bridgeBaseUrl || envelope.payload.bridge_base_url || envelope.payload.bridgeBaseUrl,
    }
  : envelope;`,
    )
    .replace(
      'const rawDesign = input.design_preferences ?? input.design ?? {};',
      'const rawDesign = input.design_preferences ?? input.design ?? input.preferences ?? {};',
    )
    .replace(
      "target_audience: String(input.target_audience || '').trim(),",
      "target_audience: String(input.target_audience || input.audience || '').trim(),",
    );
}

function patchSiteArchitecturePromptNode(workflow) {
  const prepareSiteArchitecture = getNode(workflow, 'Prepare site_architecture prompt');

  prepareSiteArchitecture.parameters.jsCode = prepareSiteArchitecture.parameters.jsCode
    .replace(/\\\$\{JSON\.stringify/g, '${JSON.stringify');
}

function patchWorkflow(workflow) {
  const workflowName = workflow.name;
  const storeSiteArchitecture = getNode(workflow, 'Bridge - Store site_architecture');
  const buildDesignPlan = getNode(workflow, 'Build design_plan');
  const validateDesignPlan = getNode(workflow, 'Bridge - Validate design_plan');
  const storeDesignPlan = getNode(workflow, 'Bridge - Store design_plan');
  const buildWordpressPlan = getNode(workflow, 'Build wordpress_plan');

  patchNormalizedBriefNode(workflow);
  patchSiteArchitecturePromptNode(workflow);

  const [baseX, baseY] = [3648, 192];

  upsertNode(workflow, {
    id: 'prepare-design-plan-prompt',
    name: 'Prepare design_plan prompt',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [baseX, baseY],
    parameters: {
      jsCode: prepareDesignPlanPromptCode(workflowName),
    },
  });

  upsertNode(workflow, {
    id: 'agent-design-plan',
    name: 'Agent - design_plan',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [baseX + 256, baseY],
    parameters: {
      method: 'POST',
      url: 'http://host.docker.internal:3000/task',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'content-type',
            value: 'application/json',
          },
        ],
      },
      sendBody: true,
      bodyParameters: {
        parameters: [
          {
            name: 'engine',
            value: 'codex',
          },
          {
            name: 'prompt',
            value: '={{ $json.prompt }}',
          },
          {
            name: 'expect_json',
            value: '={{ true }}',
          },
          {
            name: 'context',
            value: `={{ { task_id: $execution.id, stage: 'design_plan', workflow: '${workflowName}' } }}`,
          },
        ],
      },
      options: {},
    },
  });

  buildDesignPlan.position = [baseX + 512, baseY];
  buildDesignPlan.parameters.jsCode = buildDesignPlanWrapperCode(workflowName);
  validateDesignPlan.position = [baseX + 768, baseY];
  storeDesignPlan.position = [baseX + 1024, baseY];
  buildWordpressPlan.parameters.jsCode = buildWordpressPlanCode(workflowName);

  workflow.connections[storeSiteArchitecture.name] = {
    main: [
      [
        {
          node: 'Build content_plan',
          type: 'main',
          index: 0,
        },
        {
          node: 'Prepare design_plan prompt',
          type: 'main',
          index: 0,
        },
      ],
    ],
  };

  workflow.connections['Prepare design_plan prompt'] = {
    main: [
      [
        {
          node: 'Agent - design_plan',
          type: 'main',
          index: 0,
        },
      ],
    ],
  };

  workflow.connections['Agent - design_plan'] = {
    main: [
      [
        {
          node: 'Build design_plan',
          type: 'main',
          index: 0,
        },
      ],
    ],
  };

  workflow.connections['Build design_plan'] = {
    main: [
      [
        {
          node: 'Bridge - Validate design_plan',
          type: 'main',
          index: 0,
        },
      ],
    ],
  };

  return workflow;
}

async function main() {
  const env = parseEnv(await fs.readFile('.env', 'utf8'));
  if (!env.N8N_URL || !env.N8N_API_KEY) {
    throw new Error('Missing N8N_URL or N8N_API_KEY in .env');
  }

  const backupDir = path.resolve('tmp', 'n8n-workflow-backups');
  await fs.mkdir(backupDir, { recursive: true });

  for (const workflowId of WORKFLOW_IDS) {
    const workflow = await requestJson(`${env.N8N_URL}/api/v1/workflows/${workflowId}`, env.N8N_API_KEY);
    const backupPath = path.join(backupDir, `${workflowId}.before-design-agent.json`);
    await fs.writeFile(backupPath, JSON.stringify(workflow, null, 2));

    const patched = patchWorkflow(workflow);
    const payload = sanitizeWorkflowForUpdate(patched);
    const payloadPath = path.join(backupDir, `${workflowId}.patched-design-agent.json`);
    await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2));

    const updated = await requestJson(`${env.N8N_URL}/api/v1/workflows/${workflowId}`, env.N8N_API_KEY, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    console.log(JSON.stringify({
      workflowId,
      name: updated.name,
      updatedAt: updated.updatedAt,
      backupPath,
      payloadPath,
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
