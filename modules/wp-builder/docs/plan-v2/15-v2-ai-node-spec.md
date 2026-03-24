# V2 AI Node Spec

## But

Ce fichier complète [14-v2-ai-migration-plan.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/14-v2-ai-migration-plan.md) avec une spécification **mécanique** pour qu'un agent Codex puisse modifier `wp-builder-v2` sans ambiguïté.

Le périmètre est volontairement limité :

- remplacer `Build discovery_brief`
- remplacer `Build site_architecture`
- ne pas modifier la structure générale du workflow
- conserver les connexions qui fonctionnent déjà

## Workflow cible

- workflow n8n : `wp-builder-v2`
- workflow id : `EctXYJ4mDFDKRqLH`

## Contraintes globales

- ne pas modifier la V1
- ne pas modifier `wp-builder-v2-validation-loop`
- ne pas modifier `wp-builder-v2-targeted-rebuild`
- ne pas toucher aux nœuds :
  - `Build normalized_brief`
  - `Build content_plan`
  - `Build design_plan`
  - `Build wordpress_plan`
  - `Build execution_plan`
  - `Bridge - Validate ...`
  - `Bridge - Store ...`
- réutiliser le pattern `/task` de la V1

## Endpoint agent à utiliser

Tous les appels IA passent par :

```text
http://192.168.1.147:3000/task
```

Headers :

```json
{
  "content-type": "application/json"
}
```

## Règle de sortie

L'agent IA ne doit pas construire l'artefact V2 complet.

Il doit seulement produire le **payload métier**.

Ensuite un nœud `Code` reconstruit l'objet :

```json
{
  "request_id": "...",
  "artifact_type": "...",
  "artifact": {
    "contract_version": "1.0",
    "request_id": "...",
    "stage": "...",
    "payload": { ... }
  },
  "bridge_base_url": "...",
  "source_artifacts": [...],
  "generator": { ... }
}
```

## Partie 1 : `discovery_brief`

## Nœud à remplacer

- `Build discovery_brief`

## Nœuds à créer

1. `Prepare discovery_brief prompt`
2. `Agent - discovery_brief`
3. `Wrap discovery_brief artifact`

## Connexions exactes

### Avant

- `Bridge - Store normalized_brief`
  ->
  `Build discovery_brief`
  ->
  `Bridge - Validate discovery_brief`

### Après

- `Bridge - Store normalized_brief`
  ->
  `Prepare discovery_brief prompt`
  ->
  `Agent - discovery_brief`
  ->
  `Wrap discovery_brief artifact`
  ->
  `Bridge - Validate discovery_brief`

Le reste reste inchangé :

- `Bridge - Validate discovery_brief`
  ->
  `Bridge - Store discovery_brief`

## Spécification du nœud `Prepare discovery_brief prompt`

Type :

- `Code` ou `Set`

Sortie minimale attendue :

```json
{
  "request_id": "req-123",
  "bridge_base_url": "http://192.168.1.147:3000",
  "artifact_type": "discovery_brief",
  "normalized_artifact": { "...": "..." },
  "normalized_version": 1,
  "prompt": "..."
}
```

### Source des données

- `Build normalized_brief`.json.artifact
- `Bridge - Store normalized_brief`.json.version
- `Build normalized_brief`.json.bridge_base_url

### Prompt à générer

Le prompt doit demander uniquement le `payload` de `discovery_brief`.

Prompt type :

```text
Tu es le collecteur / planner discovery.
À partir du normalized_brief suivant, retourne uniquement un JSON valide.

Le JSON doit correspondre au payload de discovery_brief avec la structure :
{
  "objectives": [
    { "description": "string", "priority": "high|medium|low" }
  ],
  "constraints": {
    "technical": ["string"],
    "business": ["string"],
    "timeline": "string"
  },
  "assumptions": ["string"],
  "missing_information": ["string"],
  "risk_flags": [
    {
      "description": "string",
      "severity": "low|medium|high",
      "mitigation": "string"
    }
  ]
}

Retourne uniquement le JSON.
N'ajoute aucun texte avant ou après.

normalized_brief :
{{ JSON.stringify($('Build normalized_brief').first().json.artifact.payload, null, 2) }}
```

## Spécification du nœud `Agent - discovery_brief`

Type :

- `HTTP Request`

URL :

```text
http://192.168.1.147:3000/task
```

Method :

- `POST`

Body :

```json
{
  "engine": "codex",
  "prompt": "={{ $json.prompt }}",
  "expect_json": "={{ true }}",
  "context": "={{ { task_id: $execution.id, stage: 'discovery_brief', workflow: 'wp-builder-v2' } }}"
}
```

Headers :

```json
{
  "content-type": "application/json"
}
```

## Hypothèse de sortie bridge `/task`

Le nœud doit exploiter :

- `$json.parsed_json`

Si le bridge de sortie change plus tard, adapter ce point.

## Spécification du nœud `Wrap discovery_brief artifact`

Type :

- `Code`

Rôle :

- reprendre `$json.parsed_json`
- reconstruire l'artefact V2 complet

Sortie attendue :

```json
{
  "request_id": "...",
  "artifact_type": "discovery_brief",
  "artifact": {
    "contract_version": "1.0",
    "request_id": "...",
    "stage": "discovery_brief",
    "payload": { "...": "..." }
  },
  "bridge_base_url": "...",
  "source_artifacts": [
    {
      "artifact_type": "normalized_brief",
      "version": 1
    }
  ],
  "generator": {
    "workflow": "wp-builder-v2",
    "stage": "discovery_brief",
    "execution_id": "...",
    "source_stage": "normalized_brief",
    "engine": "codex"
  }
}
```

### Champs à produire

- `request_id` :
  - depuis `Prepare discovery_brief prompt`
- `artifact_type` :
  - `discovery_brief`
- `artifact.contract_version` :
  - `1.0`
- `artifact.request_id` :
  - même valeur
- `artifact.stage` :
  - `discovery_brief`
- `artifact.payload` :
  - `parsed_json`
- `bridge_base_url` :
  - depuis `Prepare discovery_brief prompt`
- `source_artifacts` :
  - `normalized_brief` avec sa version stockée
- `generator` :
  - `workflow = wp-builder-v2`
  - `stage = discovery_brief`
  - `execution_id = $execution.id`
  - `source_stage = normalized_brief`
  - `engine = codex`

## Partie 2 : `site_architecture`

## Nœud à remplacer

- `Build site_architecture`

## Nœuds à créer

1. `Prepare site_architecture prompt`
2. `Agent - site_architecture`
3. `Wrap site_architecture artifact`

## Connexions exactes

### Avant

- `Bridge - Store discovery_brief`
  ->
  `Build site_architecture`
  ->
  `Bridge - Validate site_architecture`

### Après

- `Bridge - Store discovery_brief`
  ->
  `Prepare site_architecture prompt`
  ->
  `Agent - site_architecture`
  ->
  `Wrap site_architecture artifact`
  ->
  `Bridge - Validate site_architecture`

Le reste reste inchangé :

- `Bridge - Validate site_architecture`
  ->
  `Bridge - Store site_architecture`

## Spécification du nœud `Prepare site_architecture prompt`

Type :

- `Code` ou `Set`

Sortie minimale attendue :

```json
{
  "request_id": "req-123",
  "bridge_base_url": "http://192.168.1.147:3000",
  "artifact_type": "site_architecture",
  "normalized_artifact": { "...": "..." },
  "discovery_artifact": { "...": "..." },
  "discovery_version": 1,
  "prompt": "..."
}
```

### Source des données

- `Build normalized_brief`.json.artifact
- `Wrap discovery_brief artifact`.json.artifact
- `Bridge - Store discovery_brief`.json.version
- `Build normalized_brief`.json.bridge_base_url

### Prompt à générer

Le prompt doit demander uniquement le `payload` de `site_architecture`.

Prompt type :

```text
Tu es l'architecte du site.
À partir du discovery_brief et du normalized_brief suivants, retourne uniquement un JSON valide.

Le JSON doit correspondre au payload de site_architecture avec la structure :
{
  "site_name": "string",
  "site_type": "string",
  "pages": [
    {
      "slug": "string",
      "title": "string",
      "goal": "string",
      "sections": [
        {
          "type": "string",
          "title": "string",
          "content_brief": "string"
        }
      ]
    }
  ],
  "design_direction": {
    "tone": "string",
    "colors": "string",
    "layout": "string"
  },
  "technical_notes": ["string"]
}

Retourne uniquement le JSON.
N'ajoute aucun texte avant ou après.

normalized_brief :
{{ JSON.stringify($('Build normalized_brief').first().json.artifact.payload, null, 2) }}

discovery_brief :
{{ JSON.stringify($('Wrap discovery_brief artifact').first().json.artifact.payload, null, 2) }}
```

## Spécification du nœud `Agent - site_architecture`

Type :

- `HTTP Request`

URL :

```text
http://192.168.1.147:3000/task
```

Method :

- `POST`

Body :

```json
{
  "engine": "codex",
  "prompt": "={{ $json.prompt }}",
  "expect_json": "={{ true }}",
  "context": "={{ { task_id: $execution.id, stage: 'site_architecture', workflow: 'wp-builder-v2' } }}"
}
```

Headers :

```json
{
  "content-type": "application/json"
}
```

## Hypothèse de sortie bridge `/task`

Le nœud doit exploiter :

- `$json.parsed_json`

## Spécification du nœud `Wrap site_architecture artifact`

Type :

- `Code`

Rôle :

- reprendre `$json.parsed_json`
- reconstruire l'artefact V2 complet

Sortie attendue :

```json
{
  "request_id": "...",
  "artifact_type": "site_architecture",
  "artifact": {
    "contract_version": "1.0",
    "request_id": "...",
    "stage": "site_architecture",
    "payload": { "...": "..." }
  },
  "bridge_base_url": "...",
  "source_artifacts": [
    {
      "artifact_type": "discovery_brief",
      "version": 1
    }
  ],
  "generator": {
    "workflow": "wp-builder-v2",
    "stage": "site_architecture",
    "execution_id": "...",
    "source_stage": "discovery_brief",
    "engine": "codex"
  }
}
```

## Compatibilité aval

Le nouveau `Wrap site_architecture artifact` doit rester compatible avec :

- `Bridge - Validate site_architecture`
- `Bridge - Store site_architecture`
- `Build content_plan`
- `Build design_plan`

Donc les expressions aval doivent pouvoir retrouver :

- `artifact`
- `bridge_base_url`
- `request_id`
- `source_artifacts`
- `generator`

## Ce que Codex doit modifier

Codex doit :

1. lire le workflow `wp-builder-v2`
2. identifier les nœuds :
   - `Build discovery_brief`
   - `Build site_architecture`
3. remplacer chacun par :
   - préparation prompt
   - agent HTTP `/task`
   - wrap artifact
4. reconnecter exactement comme décrit plus haut
5. ne pas changer le reste du workflow

## Ce que Codex ne doit pas faire

Codex ne doit pas :

- refactorer tout le workflow
- toucher la V1
- introduire `claude` pour l'instant
- modifier `validation-loop`
- modifier `targeted-rebuild`
- réécrire `content_plan`, `design_plan`, `wordpress_plan`, `execution_plan`

## Vérifications obligatoires après modification

1. `discovery_brief` est toujours validé par :
   - `Bridge - Validate discovery_brief`

2. `site_architecture` est toujours validé par :
   - `Bridge - Validate site_architecture`

3. les artefacts sont toujours stockés via :
   - `Bridge - Store discovery_brief`
   - `Bridge - Store site_architecture`

4. le reste du workflow continue sans changement

5. la sortie finale de `wp-builder-v2` contient toujours :
   - `normalized_brief`
   - `discovery_brief`
   - `site_architecture`
   - `content_plan`
   - `design_plan`
   - `wordpress_plan`
   - `execution_plan`

## Résumé pour Codex

Travail demandé :

- dans `wp-builder-v2`
- remplacer seulement deux nœuds `Code`
- utiliser le pattern `/task` de la V1
- garder les connexions existantes
- faire produire le contenu métier par `codex`
- faire l'enveloppe technique V2 dans n8n
