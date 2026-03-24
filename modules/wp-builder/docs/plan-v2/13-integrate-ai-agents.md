# Intégrer Les Agents IA Dans Le Workflow V2

## But

Cette doc explique concrètement comment intégrer tes agents IA dans le workflow `WP Builder V2`, sans théorie inutile.

Le point clé est simple :

- les agents IA vivent dans `WP Builder V2 - Plan Generation`
- ils sont appelés depuis n8n via le bridge `/task`
- chaque agent produit un JSON
- ce JSON est ensuite stocké comme artefact côté bridge

## Principe général

Dans n8n, un agent IA n'est pas un type de nœud spécial.

Concrètement, un agent IA est :

1. un nœud qui prépare les données d'entrée
2. un nœud `HTTP Request` qui appelle `POST /task`
3. un nœud qui récupère le JSON retourné
4. un nœud qui stocke ce JSON comme artefact

Donc :

- `Collecteur`
- `Architecte`
- `Content Planner`
- `Design Planner`
- `WordPress Planner`
- `Execution Planner`

ne sont pas juste des noms.

Ils doivent devenir de vrais appels HTTP vers ton bridge.

## Où mettre les agents

Les agents doivent être intégrés dans :

- `WP Builder V2 - Plan Generation`

Ils ne doivent pas être intégrés en priorité dans :

- `WP Builder V2 - WordPress Execution`

Pourquoi :

- `Plan Generation` sert à réfléchir, structurer et produire les artefacts
- `WordPress Execution` sert à appliquer un plan déjà validé

## Structure minimale d'une étape IA

Pour chaque étape métier, garde toujours la même structure :

1. `Load Input`
   Lire la demande ou l'artefact précédent.

2. `Prepare Prompt`
   Construire le prompt à envoyer à l'agent.

3. `HTTP Request -> /task`
   Appeler `codex` ou `claude`.

4. `Parse Result`
   Récupérer le JSON produit.

5. `Store Artifact`
   Enregistrer le résultat dans le bridge.

6. `Next Step`
   Passer à l'étape suivante.

## Endpoint à utiliser

L'appel agent passe par :

- `POST /task`

URL typique :

```text
http://192.168.1.147:3000/task
```

Adapte l'host si ton bridge écoute ailleurs.

## Payload minimal pour un agent

Exemple générique :

```json
{
  "engine": "codex",
  "prompt": "Ton prompt ici",
  "expect_json": true,
  "context": {
    "request_id": "req-123",
    "stage": "site_architecture"
  }
}
```

Champs importants :

- `engine`
  - `codex` ou `claude`
- `prompt`
  - instruction complète envoyée à l'agent
- `expect_json`
  - doit être `true` si tu veux un artefact structuré
- `context`
  - métadonnées utiles pour logs, debug et suivi

## Quel engine utiliser

Pour démarrer simplement :

- utilise `codex` partout

Ensuite seulement, si tu as une vraie raison, tu peux répartir :

- `codex`
  - JSON strict
  - structures techniques
  - plans d'architecture
- `claude`
  - reformulation
  - synthèse
  - enrichissement éditorial

Mais au début, ne complique pas.

Le plus simple est :

- `normalized_brief` -> `codex`
- `discovery_brief` -> `codex`
- `site_architecture` -> `codex`
- puis le reste plus tard

## Première intégration recommandée

Ne branche pas tous les agents d'un coup.

Commence par seulement 3 étapes :

1. `normalized_brief`
2. `discovery_brief`
3. `site_architecture`

Pourquoi :

- tu valides le mécanisme d'appel agent
- tu valides le stockage des artefacts
- tu valides la qualité des prompts
- tu réduis les erreurs en chaîne

## Enchaînement conseillé dans n8n

### Étape 1 : `normalized_brief`

Entrée :

- demande brute créée côté frontend/bridge

Action :

- appeler `/task`
- demander un JSON normalisé

Sortie :

- artefact `normalized_brief`

### Étape 2 : `discovery_brief`

Entrée :

- `normalized_brief`

Action :

- appeler `/task`
- enrichir les besoins, contraintes, signaux utiles

Sortie :

- artefact `discovery_brief`

### Étape 3 : `site_architecture`

Entrée :

- `discovery_brief`

Action :

- appeler `/task`
- demander l'architecture du site conforme au schéma

Sortie :

- artefact `site_architecture`

Après ça, tu peux déjà :

- stocker l'artefact
- demander une validation humaine

## Exemple concret pour `site_architecture`

### Appel agent

```json
{
  "engine": "codex",
  "prompt": "Tu es l'architecte du site. Retourne uniquement un JSON valide conforme au schema site_architecture. Les données d'entrée sont : {{$json.discovery_brief}}",
  "expect_json": true,
  "context": {
    "request_id": "{{$json.request_id}}",
    "stage": "site_architecture"
  }
}
```

### Puis stockage artefact

Le résultat de l'agent doit être envoyé au backend V2 pour être persisté comme artefact versionné.

Le bridge doit recevoir au minimum :

- `requestId`
- `artifact_type`
- `payload`
- éventuellement `generator`
- éventuellement `source_artifacts`

Exemple logique :

```json
{
  "requestId": "req-123",
  "artifact_type": "site_architecture",
  "payload": {
    "contract_version": "1.0",
    "request_id": "req-123",
    "stage": "site_architecture",
    "payload": {
      "site_name": "Mon Site",
      "site_type": "site vitrine"
    }
  },
  "generator": {
    "engine": "codex",
    "workflow": "wp-builder-v2-plan-generation",
    "node": "Agent - Site Architecture"
  },
  "source_artifacts": [
    {
      "type": "discovery_brief",
      "version": 1
    }
  ]
}
```

## Ce qu'il faut mettre dans `context`

Le `context` doit rester simple et utile.

Recommandé :

```json
{
  "request_id": "req-123",
  "stage": "site_architecture",
  "workflow": "wp-builder-v2-plan-generation",
  "node": "Agent - Site Architecture"
}
```

Utile pour :

- les logs bridge
- le debug n8n
- retracer quel nœud a produit quel artefact

## Comment rédiger les prompts

Règles simples :

- demander uniquement du JSON
- rappeler le schéma attendu
- injecter les données sources
- interdire le texte hors JSON

Mauvais style :

- prompt vague
- pas de schéma
- sortie libre

Bon style :

- rôle clair
- schéma clair
- sortie strictement JSON

Exemple :

```text
Tu es l'architecte du site.
Retourne uniquement un JSON valide.
Le JSON doit respecter le schéma site_architecture.
N'ajoute aucun texte avant ou après.
Données d'entrée :
...
```

## Erreurs à éviter

### 1. Ne pas stocker l'artefact après l'agent

Si tu appelles l'agent mais que tu ne persistes pas le résultat :

- tu perds l'historique
- tu ne peux pas versionner
- tu ne peux pas relancer proprement

### 2. Laisser l'agent renvoyer du texte libre

Si `expect_json` n'est pas proprement utilisé :

- le parsing devient fragile
- la validation de schéma devient inutile

### 3. Tout brancher d'un coup

Si tu ajoutes tous les agents en même temps :

- tu empiles les erreurs
- tu ne sais plus quelle étape casse

### 4. Mélanger plan et exécution

Les agents de planification doivent vivre dans `Plan Generation`, pas dans le workflow d'exécution.

## Ordre de mise en place recommandé

1. Ajouter l'appel agent pour `normalized_brief`
2. Ajouter le stockage artefact
3. Vérifier le schéma
4. Ajouter `discovery_brief`
5. Ajouter le stockage artefact
6. Vérifier le schéma
7. Ajouter `site_architecture`
8. Ajouter le stockage artefact
9. Ajouter la validation humaine

Ne fais pas `content_plan`, `design_plan`, `wordpress_plan` et `execution_plan` tant que ce tronc n'est pas stable.

## Définition simple du workflow `Plan Generation`

Le workflow doit répondre à cette logique :

- prendre une demande
- appeler un agent IA
- stocker l'artefact
- appeler le prochain agent
- stocker l'artefact
- passer en validation
- si changement demandé, relancer seulement la bonne étape

## Résumé

Intégrer les agents IA veut dire :

- ajouter dans n8n des nœuds `HTTP Request` vers `/task`
- un nœud agent par phase métier
- exiger du JSON valide
- stocker chaque sortie comme artefact

Le plus simple pour toi maintenant :

- mettre 3 agents dans `WP Builder V2 - Plan Generation`
- `normalized_brief`
- `discovery_brief`
- `site_architecture`

et ne pas aller plus loin tant que ce premier tronçon n'est pas propre.
