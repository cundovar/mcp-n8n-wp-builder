# Plan Concret Pour Intégrer Les Agents IA Dans `wp-builder-v2`

## But

Cette doc explique comment modifier **le workflow existant** `wp-builder-v2` pour y intégrer progressivement les agents IA, **sans casser la structure qui fonctionne déjà**.

Le principe retenu est :

- on garde `wp-builder-v2`
- on garde `wp-builder-v2-validation-loop`
- on garde `wp-builder-v2-targeted-rebuild`
- on **ne touche pas à la V1**
- on remplace seulement certaines étapes `Build ...` de `wp-builder-v2` par des appels IA via `/task`

## Point de départ réel

Aujourd'hui :

- `WP Site Builder — Core Pipeline` = V1 avec agents IA réels via `POST /task`
- `wp-builder-v2` = V2 principal, mais sans agents IA
- `wp-builder-v2-validation-loop` = boucle de décision humaine
- `wp-builder-v2-targeted-rebuild` = reconstruction ciblée

Le problème actuel est simple :

- dans `wp-builder-v2`, les nœuds `Build ...` sont des nœuds `Code`
- ils génèrent les artefacts en JavaScript
- ils n'appellent ni `codex` ni `claude`

Donc la bonne migration n'est pas de créer un nouveau workflow.

La bonne migration est :

- garder `wp-builder-v2`
- remplacer progressivement certains nœuds `Code`
- conserver toutes les connexions de validation, stockage et rebuild déjà en place

## Ce qu'on garde tel quel

Dans `wp-builder-v2`, on garde pour l'instant :

- `Plan Request Webhook`
- tous les nœuds `Bridge - Validate ...`
- tous les nœuds `Bridge - Store ...`
- le branchement vers `content_plan`
- le branchement vers `design_plan`
- le branchement vers `wordpress_plan`
- le branchement vers `execution_plan`
- `Return planning artifacts`

Dans les autres workflows, on garde tel quel :

- `wp-builder-v2-validation-loop`
- `wp-builder-v2-targeted-rebuild`

## Ce qu'on modifie maintenant

Phase 1 uniquement :

1. remplacer `Build discovery_brief` par un appel IA
2. remplacer `Build site_architecture` par un appel IA
3. laisser tout le reste en JavaScript pour l'instant

Donc :

- `Build normalized_brief` reste en `Code`
- `Build discovery_brief` devient un agent IA
- `Build site_architecture` devient un agent IA
- `Build content_plan` reste en `Code`
- `Build design_plan` reste en `Code`
- `Build wordpress_plan` reste en `Code`
- `Build execution_plan` reste en `Code`

## Pourquoi cet ordre

Parce que c'est le meilleur compromis :

- `normalized_brief` est simple et fiable en code
- `discovery_brief` bénéficie bien d'un agent
- `site_architecture` bénéficie fortement d'un agent
- l'aval peut rester déterministe pour l'instant

Ainsi :

- tu injectes l'IA là où elle apporte vraiment quelque chose
- tu ne casses pas toute la V2
- tu gardes le stockage/versioning déjà en place

## Le pattern exact à reprendre depuis la V1

Dans la V1, les appels IA qui marchent utilisent :

- nœud `HTTP Request`
- URL : `http://192.168.1.147:3000/task`
- header :
  - `content-type: application/json`
- body :
  - `engine`
  - `prompt`
  - `expect_json`
  - parfois `context`

Exemple réel V1 :

```json
{
  "engine": "codex",
  "prompt": "Tu es l'architecte ... retourne uniquement un JSON valide ...",
  "expect_json": true,
  "context": {
    "task_id": "{{$execution.id}}",
    "stage": "architecte"
  }
}
```

C'est ce pattern qu'il faut réutiliser dans `wp-builder-v2`.

## Migration concrète dans `wp-builder-v2`

## Étape 1 : remplacer `Build discovery_brief`

### À faire

Supprimer la logique métier du nœud `Build discovery_brief` et la remplacer par :

1. un nœud de préparation du prompt
2. un nœud `HTTP Request` vers `/task`
3. éventuellement un nœud léger de remapping de sortie

### Connexions à conserver

Tu gardes cette chaîne :

- `Bridge - Store normalized_brief`
  ->
  `nouveau nœud agent discovery_brief`
  ->
  `Bridge - Validate discovery_brief`
  ->
  `Bridge - Store discovery_brief`

Autrement dit :

- on ne change pas l'entrée ni la sortie de l'étape
- on change seulement la manière de produire `discovery_brief`

### Entrée disponible

Le nouvel agent doit repartir de :

- `Build normalized_brief`.json.artifact
- et si besoin :
  - `Bridge - Store normalized_brief`.json.version

### Sortie attendue

Le nouvel agent doit produire exactement une structure compatible avec :

- `artifact_type = discovery_brief`
- `artifact = { contract_version, request_id, stage, payload }`
- `bridge_base_url`
- `source_artifacts`
- `generator`

Donc même si l'agent renvoie seulement le JSON métier, il faudra probablement un petit nœud `Code` juste après pour envelopper proprement la sortie dans le format V2 attendu par `Bridge - Validate discovery_brief`.

### Recommandation technique

Ne demande pas à l'agent de construire toute l'enveloppe technique V2.

Demande-lui seulement le `payload` métier de `discovery_brief`.

Puis fais l'enveloppe dans n8n.

C'est plus robuste.

### Prompt conseillé

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

### Payload `/task` conseillé

```json
{
  "engine": "codex",
  "prompt": "...",
  "expect_json": true,
  "context": {
    "task_id": "{{$execution.id}}",
    "stage": "discovery_brief",
    "workflow": "wp-builder-v2"
  }
}
```

### Nœuds recommandés

- `Prepare discovery_brief prompt`
- `Agent - discovery_brief`
- `Wrap discovery_brief artifact`

## Étape 2 : remplacer `Build site_architecture`

### À faire

Même logique :

1. préparer le prompt
2. appeler `/task`
3. réenvelopper le résultat dans le format artefact V2

### Connexions à conserver

Tu gardes exactement :

- `Bridge - Store discovery_brief`
  ->
  `nouveau nœud agent site_architecture`
  ->
  `Bridge - Validate site_architecture`
  ->
  `Bridge - Store site_architecture`

Puis le reste reste inchangé :

- `Bridge - Store site_architecture`
  ->
  `Build content_plan`
  et
  `Build design_plan`

### Entrée disponible

Le nouvel agent doit repartir de :

- `Build normalized_brief`.json.artifact.payload
- `Build discovery_brief` remplacé, ou plus proprement :
  - du résultat stocké ou enveloppé de `discovery_brief`

### Sortie attendue

L'agent doit produire le `payload` métier de `site_architecture`, conforme au schéma :

- `site_name`
- `site_type`
- `pages`
- `design_direction`
- `technical_notes`

Puis n8n reconstruit :

- `contract_version`
- `request_id`
- `stage`
- `source_artifacts`
- `generator`

### Prompt conseillé

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

### Payload `/task` conseillé

```json
{
  "engine": "codex",
  "prompt": "...",
  "expect_json": true,
  "context": {
    "task_id": "{{$execution.id}}",
    "stage": "site_architecture",
    "workflow": "wp-builder-v2"
  }
}
```

### Nœuds recommandés

- `Prepare site_architecture prompt`
- `Agent - site_architecture`
- `Wrap site_architecture artifact`

## Ce qu'il ne faut pas changer

Pour cette phase de migration :

- ne change pas `Bridge - Validate normalized_brief`
- ne change pas `Bridge - Store normalized_brief`
- ne change pas `Bridge - Validate discovery_brief`
- ne change pas `Bridge - Store discovery_brief`
- ne change pas `Bridge - Validate site_architecture`
- ne change pas `Bridge - Store site_architecture`
- ne change pas `Build content_plan`
- ne change pas `Build design_plan`
- ne change pas `Build wordpress_plan`
- ne change pas `Build execution_plan`
- ne change pas `wp-builder-v2-validation-loop`
- ne change pas `wp-builder-v2-targeted-rebuild`

## Mapping précis des nœuds

## Avant

- `Build normalized_brief` -> code
- `Build discovery_brief` -> code
- `Build site_architecture` -> code
- `Build content_plan` -> code
- `Build design_plan` -> code
- `Build wordpress_plan` -> code
- `Build execution_plan` -> code

## Après phase 1

- `Build normalized_brief` -> code
- `Prepare discovery_brief prompt` -> code/set
- `Agent - discovery_brief` -> HTTP `/task`
- `Wrap discovery_brief artifact` -> code
- `Prepare site_architecture prompt` -> code/set
- `Agent - site_architecture` -> HTTP `/task`
- `Wrap site_architecture artifact` -> code
- `Build content_plan` -> code
- `Build design_plan` -> code
- `Build wordpress_plan` -> code
- `Build execution_plan` -> code

## Pourquoi garder un petit nœud `Code` autour de l'IA

Parce qu'il y a 2 responsabilités différentes :

1. l'IA produit le contenu métier
2. n8n construit l'objet technique V2

Si tu demandes à l'IA de faire les deux :

- tu rends le flux plus fragile
- tu risques de casser le stockage
- tu rends les erreurs plus difficiles à isoler

Donc :

- l'IA produit le `payload`
- n8n produit l'artefact complet

## Plan d'implémentation concret

### Lot 1

- remplacer `Build discovery_brief`
- tester jusqu'à `Bridge - Store discovery_brief`

### Lot 2

- remplacer `Build site_architecture`
- tester jusqu'à `Bridge - Store site_architecture`

### Lot 3

- vérifier que `Build content_plan` et `Build design_plan` consomment encore correctement l'artefact produit

## Vérifications à faire après changement

### Vérification 1

Le nouvel appel `/task` répond bien avec :

- `parsed_json`

ou l'équivalent de sortie du bridge que tu exploites déjà

### Vérification 2

`Bridge - Validate discovery_brief` passe toujours.

### Vérification 3

`Bridge - Store discovery_brief` crée bien une nouvelle version.

### Vérification 4

`Bridge - Validate site_architecture` passe toujours.

### Vérification 5

`Bridge - Store site_architecture` crée bien une nouvelle version.

### Vérification 6

Le reste du workflow continue :

- `content_plan`
- `design_plan`
- `wordpress_plan`
- `execution_plan`

## Ce que tu peux dire simplement

Le vrai plan est :

- garder `wp-builder-v2`
- ne pas créer un nouveau workflow
- remplacer seulement 2 nœuds `Code` par 2 appels IA
- conserver toutes les connexions de stockage et validation déjà en place

## Résumé exécutable

Tu fais seulement ceci :

1. dans `wp-builder-v2`, remplacer `Build discovery_brief` par :
   - préparation prompt
   - `HTTP Request -> /task`
   - wrap artifact

2. dans `wp-builder-v2`, remplacer `Build site_architecture` par :
   - préparation prompt
   - `HTTP Request -> /task`
   - wrap artifact

3. tout le reste reste identique pour l'instant

C'est la migration la plus simple, la plus lisible, et la plus proche de la V1 qui marche déjà.
