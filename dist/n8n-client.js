"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveWorkflows = getActiveWorkflows;
exports.getAllWorkflows = getAllWorkflows;
exports.getWorkflow = getWorkflow;
exports.createWorkflow = createWorkflow;
exports.updateWorkflow = updateWorkflow;
exports.deleteWorkflow = deleteWorkflow;
exports.setWorkflowActive = setWorkflowActive;
exports.executeWorkflow = executeWorkflow;
exports.getExecution = getExecution;
exports.getWorkflowExecutions = getWorkflowExecutions;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const client = axios_1.default.create({
    baseURL: process.env.N8N_URL,
    timeout: Number(process.env.N8N_TIMEOUT_MS || 5000),
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
    }
});
// Liste minimale des workflows exposes comme outils MCP.
// On ne prend que les workflows actifs car un workflow inactif ne doit pas
// apparaitre comme outil appelable par defaut.
async function getActiveWorkflows() {
    const response = await client.get('/api/v1/workflows?active=true');
    return response.data.data || [];
}
// Variante plus large, utile pour les outils d'administration et de debug.
async function getAllWorkflows() {
    const response = await client.get('/api/v1/workflows');
    return response.data.data || [];
}
// Lit le JSON complet d'un workflow.
// Cette fonction sert a la fois pour l'inspection et pour les mutations.
async function getWorkflow(id) {
    const response = await client.get(`/api/v1/workflows/${id}`);
    return response.data;
}
// Cree un workflow a partir d'une definition complete.
async function createWorkflow(workflow) {
    const response = await client.post('/api/v1/workflows', workflow);
    return response.data;
}
// Met a jour un workflow existant.
// Le serveur MCP n'essaie pas de fusionner des morceaux: il envoie la
// definition fournie par le client.
async function updateWorkflow(id, workflow) {
    const response = await client.put(`/api/v1/workflows/${id}`, workflow);
    return response.data;
}
// Suppression directe cote n8n.
async function deleteWorkflow(id) {
    const response = await client.delete(`/api/v1/workflows/${id}`);
    return response.data;
}
// Active ou desactive un workflow.
//
// Selon la version / config de n8n, les endpoints `activate` / `deactivate`
// peuvent exister ou non. On essaye donc d'abord la route specialisee,
// puis on retombe sur un `PUT` complet si necessaire.
async function setWorkflowActive(id, active) {
    try {
        const action = active ? 'activate' : 'deactivate';
        const response = await client.post(`/api/v1/workflows/${id}/${action}`);
        return response.data;
    }
    catch (error) {
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
async function executeWorkflow(workflowId, inputData) {
    // On relit le workflow pour trouver un noeud webhook eventuel.
    const workflow = await getWorkflow(workflowId);
    const webhookNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    if (webhookNode) {
        // Si un webhook est present, on utilise son chemin comme point d'entree.
        // Cela respecte mieux la logique du workflow que de forcer `/run`.
        const webhookPath = webhookNode.parameters?.path || workflowId;
        const response = await axios_1.default.post(`${process.env.N8N_URL}/webhook/${webhookPath}`, inputData);
        return {
            executionId: response.data.executionId || 'webhook',
            status: 'success',
            data: response.data
        };
    }
    // Fallback pour les workflows sans webhook.
    const response = await client.post(`/api/v1/workflows/${workflowId}/run`, { workflowData: { inputData } });
    return {
        executionId: response.data.executionId,
        status: response.data.status,
        data: response.data
    };
}
// Lit le detail d'une execution par son ID.
async function getExecution(executionId) {
    const response = await client.get(`/api/v1/executions/${executionId}`);
    return response.data;
}
// Helper utile pour debug / extension future.
// Pas encore exploite dans `index.ts`, mais garde une place utile
// si on veut enrichir les outils d'observabilite plus tard.
async function getWorkflowExecutions(workflowId, limit = 5) {
    const response = await client.get(`/api/v1/executions?workflowId=${workflowId}&limit=${limit}`);
    return response.data.data || [];
}
