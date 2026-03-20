# Serveur MCP custom pour n8n — Claude Code & Codex CLI
## Instructions pour Claude Code

Construire un serveur MCP local en Node.js qui expose les workflows n8n
comme outils MCP. Utilisable par Claude Code ET Codex CLI en local.

---

## Architecture cible

```
Claude Code ──┐
              ├──► MCP Server (Node.js local) ──► n8n API (localhost:5678)
Codex CLI ────┘
```

Le serveur MCP :
- Tourne en local via stdio (pas de port réseau)
- Se connecte à n8n via son API REST
- Expose chaque workflow n8n actif comme un outil MCP distinct
- Retourne les résultats d'exécution à l'agent

---

## Étape 1 — Structure du projet

```
n8n-mcp/
├── package.json
├── src/
│   ├── index.ts          # Point d'entrée MCP server
│   ├── n8n-client.ts     # Client API n8n
│   └── tools.ts          # Génération dynamique des outils MCP
├── .env
└── tsconfig.json
```

Créer le projet :
```bash
mkdir ~/n8n-mcp && cd ~/n8n-mcp
npm init -y
npm install @modelcontextprotocol/sdk axios dotenv
npm install -D typescript @types/node ts-node
```

---

## Étape 2 — tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

---

## Étape 3 — .env

```env
N8N_URL=http://localhost:5678
N8N_API_KEY=ton-api-key-n8n
```

Récupérer la clé : n8n → Settings → n8n API → Create API Key

---

## Étape 4 — n8n-client.ts

Ce fichier gère toute la communication avec l'API n8n.

```typescript
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const client = axios.create({
  baseURL: process.env.N8N_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
    'Content-Type': 'application/json'
  }
});

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  tags?: { name: string }[];
}

export interface WorkflowExecution {
  executionId: string;
  status: string;
  data?: any;
}

// Récupère tous les workflows actifs
export async function getActiveWorkflows(): Promise<N8nWorkflow[]> {
  const response = await client.get('/api/v1/workflows?active=true');
  return response.data.data || [];
}

// Récupère un workflow par ID
export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  const response = await client.get(`/api/v1/workflows/${id}`);
  return response.data;
}

// Déclenche un workflow via webhook ou trigger
export async function executeWorkflow(
  workflowId: string,
  inputData: Record<string, any>
): Promise<WorkflowExecution> {
  // Cherche le nœud webhook dans le workflow pour construire l'URL
  const workflow = await getWorkflow(workflowId);
  const webhookNode = workflow.nodes.find(
    n => n.type === 'n8n-nodes-base.webhook'
  );

  if (webhookNode) {
    // Exécution via webhook
    const webhookPath = webhookNode.parameters?.path || workflowId;
    const response = await axios.post(
      `${process.env.N8N_URL}/webhook/${webhookPath}`,
      inputData
    );
    return {
      executionId: response.data.executionId || 'webhook',
      status: 'success',
      data: response.data
    };
  }

  // Fallback : exécution via API directe
  const response = await client.post(
    `/api/v1/workflows/${workflowId}/run`,
    { workflowData: { inputData } }
  );
  return {
    executionId: response.data.executionId,
    status: response.data.status,
    data: response.data
  };
}

// Récupère le résultat d'une exécution
export async function getExecution(executionId: string): Promise<any> {
  const response = await client.get(`/api/v1/executions/${executionId}`);
  return response.data;
}

// Liste les dernières exécutions d'un workflow
export async function getWorkflowExecutions(
  workflowId: string,
  limit = 5
): Promise<any[]> {
  const response = await client.get(
    `/api/v1/executions?workflowId=${workflowId}&limit=${limit}`
  );
  return response.data.data || [];
}
```

---

## Étape 5 — tools.ts

Génère dynamiquement les outils MCP depuis les workflows n8n actifs.

```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { N8nWorkflow } from './n8n-client.js';

// Convertit un nom de workflow en nom d'outil MCP valide
// "WP Site Builder — Multi-Agent" → "wp_site_builder_multi_agent"
export function workflowToToolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

// Génère la description d'un outil depuis les tags du workflow
export function buildToolDescription(workflow: N8nWorkflow): string {
  const tags = workflow.tags?.map(t => t.name).join(', ') || '';
  const nodeTypes = [...new Set(
    workflow.nodes.map(n => n.type.split('.').pop())
  )].join(', ');

  return [
    `Workflow n8n : "${workflow.name}"`,
    tags ? `Tags : ${tags}` : '',
    `Nœuds : ${nodeTypes}`,
    `ID : ${workflow.id}`
  ].filter(Boolean).join(' | ');
}

// Construit la liste complète des outils MCP depuis les workflows
export function buildTools(workflows: N8nWorkflow[]): Tool[] {
  const tools: Tool[] = [];

  // Un outil par workflow actif
  for (const wf of workflows) {
    tools.push({
      name: workflowToToolName(wf.name),
      description: buildToolDescription(wf),
      inputSchema: {
        type: 'object',
        properties: {
          input_data: {
            type: 'object',
            description: 'Données à envoyer au workflow (champs libres selon le workflow)'
          },
          wait_for_result: {
            type: 'boolean',
            description: 'Attendre le résultat complet (true) ou retourner immédiatement (false)',
            default: true
          }
        },
        required: ['input_data']
      }
    });
  }

  // Outils utilitaires toujours disponibles
  tools.push({
    name: 'n8n_list_workflows',
    description: 'Liste tous les workflows n8n actifs disponibles',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  });

  tools.push({
    name: 'n8n_get_execution_status',
    description: 'Récupère le statut et résultat d\'une exécution n8n par son ID',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: {
          type: 'string',
          description: 'ID de l\'exécution à vérifier'
        }
      },
      required: ['execution_id']
    }
  });

  return tools;
}
```

---

## Étape 6 — index.ts (Serveur MCP principal)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  getActiveWorkflows,
  executeWorkflow,
  getExecution,
  getWorkflowExecutions
} from './n8n-client.js';
import {
  buildTools,
  workflowToToolName
} from './tools.js';
import dotenv from 'dotenv';
dotenv.config();

// Cache des workflows pour éviter les appels répétés
let workflowCache: Awaited<ReturnType<typeof getActiveWorkflows>> = [];
let lastCacheTime = 0;
const CACHE_TTL = 30_000; // 30 secondes

async function getWorkflows() {
  const now = Date.now();
  if (now - lastCacheTime > CACHE_TTL) {
    workflowCache = await getActiveWorkflows();
    lastCacheTime = now;
  }
  return workflowCache;
}

// Initialisation du serveur MCP
const server = new Server(
  {
    name: 'n8n-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handler : liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const workflows = await getWorkflows();
  const tools = buildTools(workflows);
  return { tools };
});

// Handler : exécution d'un outil
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Outil utilitaire : lister les workflows
    if (name === 'n8n_list_workflows') {
      const workflows = await getWorkflows();
      const list = workflows.map(wf => ({
        id: wf.id,
        name: wf.name,
        tool_name: workflowToToolName(wf.name),
        tags: wf.tags?.map(t => t.name) || []
      }));
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(list, null, 2)
        }]
      };
    }

    // Outil utilitaire : statut d'exécution
    if (name === 'n8n_get_execution_status') {
      const execution = await getExecution(args?.execution_id as string);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(execution, null, 2)
        }]
      };
    }

    // Exécution d'un workflow par nom d'outil
    const workflows = await getWorkflows();
    const workflow = workflows.find(
      wf => workflowToToolName(wf.name) === name
    );

    if (!workflow) {
      throw new Error(`Workflow introuvable pour l'outil : ${name}`);
    }

    const result = await executeWorkflow(
      workflow.id,
      (args?.input_data as Record<string, any>) || {}
    );

    // Si wait_for_result et on a un executionId, attendre
    if (args?.wait_for_result !== false && result.executionId !== 'webhook') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const execution = await getExecution(result.executionId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            execution_id: result.executionId,
            status: execution.status,
            result: execution.data
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Erreur : ${error.message}`
      }],
      isError: true
    };
  }
});

// Démarrage
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log sur stderr (stdout est réservé au protocole MCP)
  console.error('n8n MCP Server démarré — en attente de commandes');
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
```

---

## Étape 7 — package.json final

```json
{
  "name": "n8n-mcp",
  "version": "1.0.0",
  "description": "Serveur MCP custom pour n8n",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0"
  }
}
```

Build :
```bash
npm run build
# Génère dist/index.js
```

---

## Étape 8 — Configuration Claude Code

Fichier : `~/.claude/claude_desktop_config.json`
(ou `.mcp.json` à la racine du projet)

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/home/facundo/n8n-mcp/dist/index.js"],
      "env": {
        "N8N_URL": "http://localhost:5678",
        "N8N_API_KEY": "ton-api-key"
      }
    }
  }
}
```

---

## Étape 9 — Configuration Codex CLI

Codex CLI supporte MCP via son fichier de config :
`~/.codex/config.json`

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/home/facundo/n8n-mcp/dist/index.js"],
      "env": {
        "N8N_URL": "http://localhost:5678",
        "N8N_API_KEY": "ton-api-key"
      }
    }
  }
}
```

Même config, même serveur, les deux agents partagent le même binaire.

---

## Étape 10 — Test rapide

```bash
# Tester le serveur directement en CLI
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node dist/index.js

# Doit retourner la liste de tes workflows n8n comme outils
```

---

## Utilisation depuis Claude Code

```bash
# Claude Code voit automatiquement les outils après config
# Exemple de prompt :
> "Lance le workflow wp_site_builder_multi_agent avec 
   metier=plombier, ville=Paris 15e, telephone=06 12 34 56 78"

# Claude Code appelle l'outil, n8n exécute le pipeline,
# le résultat revient dans le terminal
```

---

## Utilisation depuis Codex CLI

```bash
codex "Lance le workflow de création de site WordPress pour un électricien à Lyon"
# Codex voit les mêmes outils MCP, même comportement
```

---

## Points importants pour Claude Code

1. Construire dans `~/n8n-mcp/` pour cohérence avec les configs
2. Compiler avec `npm run build` avant de configurer les agents
3. Tester le serveur en standalone AVANT de configurer Claude Code/Codex
4. Le cache de 30s évite de surcharger l'API n8n — ajustable dans `CACHE_TTL`
5. Les logs du serveur vont sur stderr — normaux, ne pas les supprimer
6. Si un workflow n'apparaît pas : vérifier qu'il est bien **actif** dans n8n
7. Pour ajouter un nouveau workflow : il suffit de l'activer dans n8n,
   le serveur le détecte automatiquement au prochain appel (cache TTL)
