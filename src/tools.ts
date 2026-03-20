import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { N8nWorkflow } from './n8n-client';

/**
 * Ce fichier ne parle ni au client MCP ni a l'API n8n.
 * Son role est purement de transformation:
 *
 * entree:
 * - des objets workflow n8n
 *
 * sortie:
 * - des definitions d'outils MCP exploitables par `index.ts`
 *
 * En bref, c'est ici que l'on traduit le monde n8n vers le monde MCP.
 */

// Convertit un nom de workflow en nom d'outil MCP valide.
// Exemple:
// "WP Site Builder — Multi-Agent" -> "wp_site_builder_multi_agent"
export function workflowToToolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

// Construit une description lisible cote client MCP.
// Le but est de donner assez de contexte pour comprendre quel workflow sera
// lance sans devoir ouvrir le JSON complet dans n8n.
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

// Transforme une liste de workflows actifs en outils MCP.
//
// Il y a deux familles d'outils produites ici:
// 1. un outil dynamique par workflow actif
// 2. un petit socle d'outils utilitaires n8n toujours presents
export function buildTools(workflows: N8nWorkflow[]): Tool[] {
  const tools: Tool[] = [];

  // Chaque workflow actif devient un outil MCP appelable par son nom normalise.
  // C'est ce mecanisme qui permet a un workflow n8n d'apparaitre comme une
  // "fonction" dans le client MCP.
  for (const wf of workflows) {
    tools.push({
      name: workflowToToolName(wf.name),
      description: buildToolDescription(wf),
      inputSchema: {
        type: 'object',
        properties: {
          input_data: {
            // On reste volontairement souple ici:
            // le serveur MCP ne connait pas le schema fin de chaque workflow.
            // C'est au workflow n8n lui-meme de valider / exploiter ces donnees.
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
    name: 'n8n_list_all_workflows',
    description: 'Liste tous les workflows n8n, actifs ou non',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  });

  tools.push({
    name: 'n8n_get_workflow',
    description: 'Récupère le JSON complet d\'un workflow n8n par son ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'ID du workflow à récupérer'
        }
      },
      required: ['workflow_id']
    }
  });

  tools.push({
    name: 'n8n_create_workflow',
    description: 'Crée un workflow n8n à partir de sa définition JSON',
    inputSchema: {
      type: 'object',
      properties: {
        workflow: {
          type: 'object',
          description: 'Définition complète du workflow n8n (name, nodes, connections, settings, tags, active, etc.)'
        }
      },
      required: ['workflow']
    }
  });

  tools.push({
    name: 'n8n_update_workflow',
    description: 'Met à jour un workflow n8n existant à partir de sa définition JSON',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'ID du workflow à mettre à jour'
        },
        workflow: {
          type: 'object',
          description: 'Définition complète du workflow n8n à enregistrer'
        }
      },
      required: ['workflow_id', 'workflow']
    }
  });

  tools.push({
    name: 'n8n_delete_workflow',
    description: 'Supprime un workflow n8n par son ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'ID du workflow à supprimer'
        }
      },
      required: ['workflow_id']
    }
  });

  tools.push({
    name: 'n8n_set_workflow_active',
    description: 'Active ou désactive un workflow n8n',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'ID du workflow à modifier'
        },
        active: {
          type: 'boolean',
          description: 'true pour activer, false pour désactiver'
        }
      },
      required: ['workflow_id', 'active']
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
