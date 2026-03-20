"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const n8n_client_1 = require("./n8n-client");
const tools_1 = require("./tools");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Ce fichier est le point d'entree du serveur MCP.
 *
 * Responsabilites:
 * - demarrer le serveur MCP en stdio
 * - exposer la liste des outils visibles par le client MCP
 * - router chaque appel d'outil vers la bonne action n8n
 *
 * Relations avec les autres fichiers:
 * - `n8n-client.ts` parle a l'API HTTP de n8n
 * - `tools.ts` transforme les workflows n8n en definitions d'outils MCP
 *
 * Flux principal:
 * 1. un client MCP se connecte en stdio
 * 2. il demande `tools/list`
 * 3. on lit les workflows actifs via `n8n-client.ts`
 * 4. on transforme ces workflows en outils MCP via `tools.ts`
 * 5. quand le client appelle un outil, on route soit vers:
 *    - un outil utilitaire n8n (`n8n_list_workflows`, etc.)
 *    - un workflow actif execute dynamiquement
 */
// Petit cache memoire pour eviter de relire la liste des workflows n8n
// a chaque `tools/list` ou `tools/call`.
let workflowCache = [];
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 secondes
let lastWorkflowFetchError = null;
// A appeler apres une creation / mise a jour / suppression,
// sinon on risque de continuer a exposer une ancienne liste d'outils.
function invalidateWorkflowCache() {
    workflowCache = [];
    lastCacheTime = 0;
    lastWorkflowFetchError = null;
}
// Formate les erreurs Axios / reseau / runtime en message compact et utile.
// L'objectif est d'avoir des erreurs lisibles cote MCP sans exposer une stack
// trop bruyante.
function formatErrorMessage(error) {
    if (!error) {
        return 'Erreur inconnue';
    }
    const parts = [];
    const message = typeof error.message === 'string' ? error.message.trim() : '';
    if (message) {
        parts.push(message);
    }
    if (error.code && !parts.includes(String(error.code))) {
        parts.push(`code=${error.code}`);
    }
    const status = error.response?.status;
    if (status) {
        parts.push(`status=${status}`);
    }
    const method = error.config?.method?.toUpperCase?.();
    const baseURL = error.config?.baseURL || '';
    const url = error.config?.url || '';
    if (method || url) {
        parts.push(`${method || 'REQUEST'} ${baseURL}${url}`);
    }
    const causeMessage = typeof error.cause?.message === 'string' ? error.cause.message.trim() : '';
    if (causeMessage && !parts.includes(causeMessage)) {
        parts.push(`cause=${causeMessage}`);
    }
    return parts.join(' | ') || error.name || 'Erreur inconnue';
}
// Retourne les workflows actifs exposes comme outils MCP.
// Si le cache est encore frais, on evite un appel HTTP inutile vers n8n.
async function getWorkflows() {
    const now = Date.now();
    if (now - lastCacheTime <= CACHE_TTL) {
        return workflowCache;
    }
    try {
        workflowCache = await (0, n8n_client_1.getActiveWorkflows)();
        lastWorkflowFetchError = null;
    }
    catch (error) {
        lastWorkflowFetchError = formatErrorMessage(error);
        console.error(`Impossible de rafraichir les workflows n8n: ${lastWorkflowFetchError}`);
    }
    lastCacheTime = now;
    return workflowCache;
}
// Initialisation du serveur MCP
const server = new index_js_1.Server({
    name: 'n8n-mcp',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {}
    }
});
// `tools/list` est appele par le client MCP pour decouvrir les outils.
// Ici, la liste n'est pas statique: elle depend des workflows actifs dans n8n.
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    const workflows = await getWorkflows();
    const tools = (0, tools_1.buildTools)(workflows);
    return { tools };
});
// `tools/call` est le coeur du serveur:
// - si le nom correspond a un outil utilitaire, on fait une operation n8n
// - sinon on suppose qu'il s'agit d'un workflow expose dynamiquement
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        // Outil utilitaire: donne une vue "orientee MCP" des workflows actifs.
        // On y ajoute `tool_name` pour montrer le nom effectivement expose au client.
        if (name === 'n8n_list_workflows') {
            const workflows = await getWorkflows();
            const list = workflows.map(wf => ({
                id: wf.id,
                name: wf.name,
                tool_name: (0, tools_1.workflowToToolName)(wf.name),
                tags: wf.tags?.map(t => t.name) || []
            }));
            const payload = lastWorkflowFetchError
                ? {
                    workflows: list,
                    warning: `n8n indisponible ou inaccessible: ${lastWorkflowFetchError}`
                }
                : list;
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(payload, null, 2)
                    }]
            };
        }
        if (name === 'n8n_list_all_workflows') {
            const workflows = await (0, n8n_client_1.getAllWorkflows)();
            const list = workflows.map(wf => ({
                id: wf.id,
                name: wf.name,
                active: wf.active,
                tool_name: (0, tools_1.workflowToToolName)(wf.name),
                tags: wf.tags?.map(t => t.name) || []
            }));
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(list, null, 2)
                    }]
            };
        }
        if (name === 'n8n_get_workflow') {
            const workflow = await (0, n8n_client_1.getWorkflow)(args?.workflow_id);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(workflow, null, 2)
                    }]
            };
        }
        if (name === 'n8n_create_workflow') {
            const workflow = await (0, n8n_client_1.createWorkflow)(args?.workflow);
            invalidateWorkflowCache();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(workflow, null, 2)
                    }]
            };
        }
        if (name === 'n8n_update_workflow') {
            const workflow = await (0, n8n_client_1.updateWorkflow)(args?.workflow_id, args?.workflow);
            invalidateWorkflowCache();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(workflow, null, 2)
                    }]
            };
        }
        if (name === 'n8n_delete_workflow') {
            const result = await (0, n8n_client_1.deleteWorkflow)(args?.workflow_id);
            invalidateWorkflowCache();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            workflow_id: args?.workflow_id,
                            deleted: true,
                            result
                        }, null, 2)
                    }]
            };
        }
        if (name === 'n8n_set_workflow_active') {
            const result = await (0, n8n_client_1.setWorkflowActive)(args?.workflow_id, Boolean(args?.active));
            invalidateWorkflowCache();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            workflow_id: args?.workflow_id,
                            active: Boolean(args?.active),
                            result
                        }, null, 2)
                    }]
            };
        }
        // Outil utilitaire: lire le detail d'une execution n8n deja lancee.
        if (name === 'n8n_get_execution_status') {
            const execution = await (0, n8n_client_1.getExecution)(args?.execution_id);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(execution, null, 2)
                    }]
            };
        }
        // A ce stade, on n'est plus dans les outils utilitaires.
        // On cherche donc un workflow actif dont le nom "normalise" correspond
        // au nom de l'outil appele par le client MCP.
        const workflows = await getWorkflows();
        const workflow = workflows.find(wf => (0, tools_1.workflowToToolName)(wf.name) === name);
        if (!workflow) {
            if (lastWorkflowFetchError) {
                throw new Error(`n8n indisponible ou inaccessible: ${lastWorkflowFetchError}`);
            }
            throw new Error(`Workflow introuvable pour l'outil : ${name}`);
        }
        const result = await (0, n8n_client_1.executeWorkflow)(workflow.id, args?.input_data || {});
        // Deux modes d'usage:
        // - wait_for_result=true: on attend un peu puis on lit l'execution
        // - wait_for_result=false: on retourne immediatement l'accuse d'execution
        //
        // Cas particulier:
        // quand l'execution passe par un webhook, n8n peut repondre sans fournir
        // un identifiant d'execution exploitable. On retourne alors la reponse brute.
        if (args?.wait_for_result !== false && result.executionId !== 'webhook') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const execution = await (0, n8n_client_1.getExecution)(result.executionId);
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
    }
    catch (error) {
        // Le protocole MCP attend une reponse bien formee, meme en erreur.
        // On transforme donc toute exception en contenu texte avec `isError: true`.
        return {
            content: [{
                    type: 'text',
                    text: `Erreur : ${formatErrorMessage(error)}`
                }],
            isError: true
        };
    }
});
// Démarrage
async function main() {
    process.stdin.resume();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Avec un transport stdio pipe, Node peut parfois sortir trop tot si rien
    // ne garde la boucle d'evenement active. Ce timer tres long sert juste a
    // maintenir le processus vivant tant que la session MCP existe.
    const keepAlive = setInterval(() => { }, 1 << 30);
    const stopKeepAlive = () => clearInterval(keepAlive);
    process.stdin.once('end', stopKeepAlive);
    process.stdin.once('close', stopKeepAlive);
    // Important: stdout est reserve au protocole MCP.
    // Tous les logs humains doivent partir sur stderr.
    console.error('n8n MCP Server démarré — en attente de commandes');
}
main().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
});
