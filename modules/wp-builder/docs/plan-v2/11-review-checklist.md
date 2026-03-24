# Review Checklist

Ce fichier sert à vérifier simplement si les tickets V2 sont bien implémentés.

Objectif :

- savoir rapidement si "tout est OK"
- éviter d'intégrer du code non vérifié
- standardiser la relecture des agents IA

## Règle simple

Un ticket est considéré comme acceptable si :

1. les fichiers s'importent sans erreur
2. le bridge démarre
3. les routes répondent si le ticket en ajoute
4. les critères d'acceptation du ticket sont réellement respectés

## Niveau 1 : Import des fichiers

Depuis :

```bash
cd /home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge
```

### Modèles Mongo

```bash
node -e "import('./src/db/models/RequestArtifact.js').then(() => console.log('ok RequestArtifact'))"
node -e "import('./src/db/models/ValidationDecision.js').then(() => console.log('ok ValidationDecision'))"
node -e "import('./src/db/models/RequestExecution.js').then(() => console.log('ok RequestExecution'))"
```

### Services backend

```bash
node -e "import('./src/services/artifact-validator.js').then(() => console.log('ok artifact-validator'))"
node -e "import('./src/services/artifact-store.js').then(() => console.log('ok artifact-store'))"
node -e "import('./src/services/dependency-graph.js').then(() => console.log('ok dependency-graph'))"
node -e "import('./src/services/validation-decision-service.js').then(() => console.log('ok validation-decision-service'))"
```

### Routes backend

```bash
node -e "import('./src/routes/artifacts.js').then(() => console.log('ok artifacts route'))"
node -e "import('./src/routes/validations.js').then(() => console.log('ok validations route'))"
node -e "import('./src/routes/executions.js').then(() => console.log('ok executions route'))"
```

### Critère OK

- la commande affiche `ok ...`
- pas de stack trace

### Critère KO

- erreur d'import
- dépendance manquante
- fichier absent

## Niveau 2 : Démarrage du bridge

```bash
cd /home/cundo/Bureau/code_perso/MCP/MCP_N8N/bridge
npm run dev
```

### Critère OK

- le serveur démarre
- MongoDB se connecte
- pas d'erreur au bootstrap

### Critère KO

- route dupliquée
- erreur de syntaxe
- erreur d'import
- erreur Mongo bloquante

## Niveau 3 : Vérification des endpoints

## Vérifier les schémas exposés

```bash
curl -sS http://localhost:3000/schemas
```

### OK attendu

- liste des types d'artefacts supportés

## Vérifier la validation d'un artefact valide

```bash
curl -sS -X POST http://localhost:3000/artifacts/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "artifact_type": "site_architecture",
    "artifact": {
      "contract_version": "1.0",
      "request_id": "req-1",
      "stage": "site_architecture",
      "payload": {
        "site_name": "Mon Site",
        "site_type": "site vitrine",
        "pages": [
          {
            "slug": "accueil",
            "title": "Accueil",
            "goal": "Présenter l offre",
            "sections": [
              {
                "type": "hero",
                "title": "Bienvenue",
                "content_brief": "Bloc hero"
              }
            ]
          }
        ],
        "design_direction": {
          "tone": "premium",
          "colors": "noir et or",
          "layout": "hero plus sections"
        },
        "technical_notes": ["note 1"]
      }
    }
  }'
```

### OK attendu

- réponse `ok: true`

## Vérifier la validation d'un artefact invalide

```bash
curl -sS -X POST http://localhost:3000/artifacts/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "artifact_type": "site_architecture",
    "artifact": {
      "contract_version": "1.0",
      "request_id": "req-1",
      "stage": "site_architecture",
      "payload": {
        "site_name": "Mon Site"
      }
    }
  }'
```

### OK attendu

- réponse d'erreur
- code HTTP `422`
- `error_type: artifact_schema_validation_error`

## Niveau 4 : Revue des critères métier

## Pour `V2-DB-01`

Vérifier :

- le modèle `RequestArtifact` existe
- plusieurs versions peuvent coexister
- index présents
- `source_artifacts` existe

## Pour `V2-DB-02`

Vérifier :

- `ValidationDecision` existe
- décisions limitées à :
  - `approved`
  - `changes_requested`
  - `rejected`

## Pour `V2-DB-03`

Vérifier :

- `RequestExecution` existe
- l'état d'exécution est distinct de `Request`

## Pour `V2-DB-04`

Vérifier :

- `current_phase` disponible dans `Request`
- `pipeline.phases` disponible
- `validation.target_artifact`
- `validation.target_version`

## Pour `V2-SCH-*`

Vérifier :

- schémas présents
- JSON valide
- structure canonique respectée

## Pour `V2-BE-01`

Vérifier :

- `artifact-store` existe
- création d'artefact possible
- récupération de la version active possible
- récupération des versions possible

## Pour `V2-BE-02`

Vérifier :

- `dependency-graph` calcule les descendants
- possibilité de marquer `stale`

## Pour `V2-BE-03` et `V2-BE-04`

Vérifier :

- lecture des artefacts d'une demande
- lecture de l'historique des versions

## Pour `V2-BE-05`

Vérifier :

- une décision humaine peut être enregistrée
- `changes_requested` cible un artefact précis

## Pour `V2-BE-06`

Vérifier :

- une demande de révision ciblée existe
- les artefacts dépendants peuvent être marqués `stale`

## Pour `V2-BE-07`

Vérifier :

- le fichier `bridge/src/routes/executions.js` existe
- `POST /requests/:id/executions` existe
- `GET /requests/:id/executions` existe
- `GET /requests/:id/executions/:executionId` existe
- la route s'importe sans erreur

## Vérification de périmètre

Toujours vérifier aussi :

- l'agent n'a pas modifié des fichiers hors ticket
- il n'a pas fait de refactor global non demandé
- il n'a pas cassé une route existante

## Décision finale

Le ticket est :

- `OK` si les imports passent, le bridge démarre, les routes répondent et les critères métier sont respectés
- `KO` si un seul de ces blocs échoue

## Formulaire de revue rapide

Tu peux utiliser ce format :

```text
Ticket :
Imports : OK / KO
Bridge démarre : OK / KO
Routes : OK / KO / N.A.
Critères métier : OK / KO
Périmètre respecté : OK / KO
Décision finale : OK / KO
Remarques :
```
