import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Ce fichier isole tout l'acces HTTP a n8n.
 *
 * Idee d'architecture:
 * - `index.ts` ne doit pas connaitre les details des routes REST n8n
 * - il appelle des fonctions "metier" plus simples:
 *   `getWorkflow`, `createWorkflow`, `executeWorkflow`, etc.
 *
 * Avantage:
 * - si l'API n8n change, la zone de modification principale reste ici
 */

const client = axios.create({
  baseURL: process.env.N8N_URL,
  timeout: Number(process.env.N8N_TIMEOUT_MS || 5000),
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
  connections?: Record<string, any>;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  pinData?: Record<string, any>;
  tags?: { name: string }[];
}

export interface WorkflowExecution {
  executionId: string;
  status: string;
  data?: any;
}

export interface WorkflowMutationInput {
  name: string;
  nodes: any[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  pinData?: Record<string, any>;
  tags?: Array<{ id?: string; name?: string }>;
  active?: boolean;
}

// Liste minimale des workflows exposes comme outils MCP.
// On ne prend que les workflows actifs car un workflow inactif ne doit pas
// apparaitre comme outil appelable par defaut.
export async function getActiveWorkflows(): Promise<N8nWorkflow[]> {
  const response = await client.get('/api/v1/workflows?active=true');
  return response.data.data || [];
}

// Variante plus large, utile pour les outils d'administration et de debug.
export async function getAllWorkflows(): Promise<N8nWorkflow[]> {
  const response = await client.get('/api/v1/workflows');
  return response.data.data || [];
}

// Lit le JSON complet d'un workflow.
// Cette fonction sert a la fois pour l'inspection et pour les mutations.
export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  const response = await client.get(`/api/v1/workflows/${id}`);
  return response.data;
}

// Cree un workflow a partir d'une definition complete.
export async function createWorkflow(
  workflow: WorkflowMutationInput
): Promise<N8nWorkflow> {
  const response = await client.post('/api/v1/workflows', workflow);
  return response.data;
}

// Met a jour un workflow existant.
// Le serveur MCP n'essaie pas de fusionner des morceaux: il envoie la
// definition fournie par le client.
export async function updateWorkflow(
  id: string,
  workflow: WorkflowMutationInput
): Promise<N8nWorkflow> {
  const response = await client.put(`/api/v1/workflows/${id}`, workflow);
  return response.data;
}

// Suppression directe cote n8n.
export async function deleteWorkflow(id: string): Promise<any> {
  const response = await client.delete(`/api/v1/workflows/${id}`);
  return response.data;
}

// Active ou desactive un workflow.
//
// Selon la version / config de n8n, les endpoints `activate` / `deactivate`
// peuvent exister ou non. On essaye donc d'abord la route specialisee,
// puis on retombe sur un `PUT` complet si necessaire.
export async function setWorkflowActive(id: string, active: boolean): Promise<any> {
  try {
    const action = active ? 'activate' : 'deactivate';
    const response = await client.post(`/api/v1/workflows/${id}/${action}`);
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status !== 404 && status !== 405) {
      throw error;
    }

    const workflow = await getWorkflow(id);
    const response = await client.put(`/api/v1/workflows/${id}`, {
      ...workflow,
      active
    });
    return response.data;
  }
}

// Lance un workflow.
//
// Strategie:
// 1. relire le workflow pour voir s'il contient un noeud webhook
// 2. si oui, appeler l'URL webhook car c'est souvent la vraie entree du flux
// 3. sinon, utiliser l'API REST `/run` comme fallback
//
// Cette logique permet de couvrir deux styles de workflows n8n:
// - workflows "entres par webhook"
// - workflows "declenchables par API"
export async function executeWorkflow(
  workflowId: string,
  inputData: Record<string, any>
): Promise<WorkflowExecution> {
  // On relit le workflow pour trouver un noeud webhook eventuel.
  const workflow = await getWorkflow(workflowId);
  const webhookNode = workflow.nodes.find(
    n => n.type === 'n8n-nodes-base.webhook'
  );

  if (webhookNode) {
    // Si un webhook est present, on utilise son chemin comme point d'entree.
    // Cela respecte mieux la logique du workflow que de forcer `/run`.
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

  // Fallback pour les workflows sans webhook.
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

// Lit le detail d'une execution par son ID.
export async function getExecution(executionId: string): Promise<any> {
  const response = await client.get(`/api/v1/executions/${executionId}`);
  return response.data;
}

// Helper utile pour debug / extension future.
// Pas encore exploite dans `index.ts`, mais garde une place utile
// si on veut enrichir les outils d'observabilite plus tard.
export async function getWorkflowExecutions(
  workflowId: string,
  limit = 5
): Promise<any[]> {
  const response = await client.get(
    `/api/v1/executions?workflowId=${workflowId}&limit=${limit}`
  );
  return response.data.data || [];
}
