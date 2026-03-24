# Agent Prompts Extended

Ce fichier complète [08-agent-prompts.md](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/docs/plan-v2/08-agent-prompts.md) avec des prompts prêts à l'emploi pour le reste du backlog.

Règle :

- un prompt = un ticket
- périmètre d'écriture fermé
- pas de refactor hors sujet

## Lot Schémas

### Prompt `V2-SCH-01`

```text
Tu implémentes le ticket : V2-SCH-01

Contexte :
- Référence principale : docs/plan-v2/07-executable-backlog.md
- Références :
  - docs/plan-v2/02-contracts-and-schemas.md
  - docs/wp-site-builder-v2-architecture.md

Objectif :
- Compléter les schémas JSON manquants

Lecture :
- schemas/
- docs/plan-v2/02-contracts-and-schemas.md

Écriture :
- schemas/normalized_brief.schema.json
- schemas/discovery_brief.schema.json
- schemas/design_plan.schema.json
- schemas/execution_report.schema.json

Contraintes :
- JSON Schema draft 2020-12
- structure canonique contract_version / request_id / stage / payload
- ne touche à aucun autre fichier

Critères d'acceptation :
- les 4 fichiers existent
- la structure est cohérente avec les schémas déjà présents

Vérification :
- lecture JSON sans erreur

Livrable :
- fichiers créés
- résumé court
```

### Prompt `V2-SCH-02`

```text
Tu implémentes le ticket : V2-SCH-02

Objectif :
- Introduire un registre de schémas côté bridge

Lecture :
- bridge/src/services/artifact-validator.js
- docs/plan-v2/02-contracts-and-schemas.md

Écriture :
- bridge/src/services/artifact-validator.js
- optionnel : bridge/src/services/schema-registry.js

Contraintes :
- ne touche à aucun autre fichier
- conserver la compatibilité de l'API actuelle

Critères d'acceptation :
- le bridge peut lister les types supportés
- les schémas sont chargés automatiquement
- erreur propre si type inconnu

Vérification :
- import Node sans erreur
```

### Prompt `V2-SCH-03`

```text
Tu implémentes le ticket : V2-SCH-03

Objectif :
- Valider les artefacts avant stockage

Lecture :
- bridge/src/services/artifact-validator.js
- bridge/src/routes/artifacts.js
- docs/plan-v2/03-bridge-backend.md

Écriture :
- bridge/src/services/artifact-store.js
- fichiers backend strictement nécessaires à l'intégration

Contraintes :
- ne touche pas au frontend
- ne modifie pas n8n

Critères d'acceptation :
- un artefact invalide n'est pas stocké comme version active
- les erreurs de validation sont structurées

Vérification :
- import Node du service
```

## Lot Data Models

### Prompt `V2-DB-03`

```text
Tu implémentes le ticket : V2-DB-03

Objectif :
- Créer le modèle Mongo RequestExecution

Lecture :
- bridge/src/db/models/Request.js
- docs/plan-v2/03-bridge-backend.md

Écriture :
- bridge/src/db/models/RequestExecution.js

Contraintes :
- Mongoose en ESM
- ne touche à aucun autre fichier

Critères d'acceptation :
- une exécution WordPress est distincte de la demande
- les étapes d'exécution peuvent être suivies
- import du modèle sans erreur
```

### Prompt `V2-DB-04`

```text
Tu implémentes le ticket : V2-DB-04

Objectif :
- Étendre Request avec pipeline et validation V2

Lecture :
- bridge/src/db/models/Request.js
- docs/plan-v2/03-bridge-backend.md

Écriture :
- bridge/src/db/models/Request.js

Contraintes :
- garder la compatibilité V1
- ne touche à aucun autre fichier

Critères d'acceptation :
- current_phase disponible
- pipeline.phases disponible
- validation.target_artifact et validation.target_version disponibles
```

## Lot Backend Bridge

### Prompt `V2-BE-02`

```text
Tu implémentes le ticket : V2-BE-02

Objectif :
- Créer le service dependency-graph

Lecture :
- docs/plan-v2/02-contracts-and-schemas.md
- docs/wp-site-builder-v2-architecture.md
- bridge/src/db/models/RequestArtifact.js

Écriture :
- bridge/src/services/dependency-graph.js

Contraintes :
- service pur, réutilisable
- pas de modification frontend ou n8n

Critères d'acceptation :
- calcul des dépendances directes
- marquage stale des descendants
- ordre de reconstruction déterministe
```

### Prompt `V2-BE-03`

```text
Tu implémentes le ticket : V2-BE-03

Objectif :
- Exposer GET /requests/:id/artifacts

Lecture :
- bridge/src/routes/artifacts.js
- bridge/src/services/artifact-store.js

Écriture :
- bridge/src/routes/artifacts.js
- bridge/src/server.js si strictement nécessaire

Contraintes :
- ne touche à aucun autre domaine

Critères d'acceptation :
- liste des artefacts d'une demande
- lecture lisible par type et version
```

### Prompt `V2-BE-04`

```text
Tu implémentes le ticket : V2-BE-04

Objectif :
- Exposer GET /requests/:id/artifacts/:type/versions

Lecture :
- bridge/src/routes/artifacts.js
- bridge/src/services/artifact-store.js

Écriture :
- bridge/src/routes/artifacts.js

Critères d'acceptation :
- historique complet des versions
- route testable par curl
```

### Prompt `V2-BE-05`

```text
Tu implémentes le ticket : V2-BE-05

Objectif :
- Exposer POST /requests/:id/validation-decisions

Lecture :
- docs/plan-v2/03-bridge-backend.md
- bridge/src/db/models/ValidationDecision.js
- bridge/src/db/models/Request.js

Écriture :
- bridge/src/routes/validations.js
- bridge/src/services/validation-decision-service.js
- bridge/src/server.js si nécessaire

Contraintes :
- ne touche pas au frontend
- ne touche pas à n8n

Critères d'acceptation :
- une décision humaine est stockée
- changes_requested cible un artefact précis
- Request.validation est mis à jour
```

### Prompt `V2-BE-06`

```text
Tu implémentes le ticket : V2-BE-06

Objectif :
- Exposer POST /requests/:id/artifacts/:type/:version/revise

Lecture :
- bridge/src/services/dependency-graph.js
- bridge/src/services/validation-decision-service.js
- docs/wp-site-builder-v2-architecture.md

Écriture :
- bridge/src/routes/artifacts.js ou bridge/src/routes/validations.js
- services backend strictement nécessaires

Contraintes :
- ne touche pas au frontend
- ne déclenche pas encore de logique n8n réelle si elle n'existe pas ; préparer le backend proprement

Critères d'acceptation :
- une révision ciblée peut être demandée
- les artefacts dépendants sont marqués stale
```

### Prompt `V2-BE-07`

```text
Tu implémentes le ticket : V2-BE-07

Objectif :
- Exposer les routes d'exécution

Lecture :
- docs/plan-v2/03-bridge-backend.md
- docs/plan-v2/07-executable-backlog.md
- bridge/src/db/models/RequestExecution.js

Écriture :
- bridge/src/routes/executions.js
- bridge/src/server.js
- services backend strictement nécessaires

Contraintes :
- ne touche pas au frontend
- ne touche pas aux workflows n8n
- ne fais pas de refactor hors périmètre

Critères d'acceptation :
- POST /requests/:id/executions existe
- GET /requests/:id/executions existe
- GET /requests/:id/executions/:executionId existe
- lecture d'une exécution WordPress distincte de la demande

Vérification :
- import Node de la route sans erreur
- route enregistrable dans le serveur
```

## Lot n8n Plan Generation

### Prompt `V2-N8N-01`

```text
Tu implémentes le ticket : V2-N8N-01

Objectif :
- Produire normalized_brief dans le workflow de planification

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- docs/plan-v2/02-contracts-and-schemas.md

Écriture :
- workflow n8n de planification V2

Contraintes :
- ne touche pas au frontend
- produire un artefact stockable côté bridge

Critères d'acceptation :
- le brief brut est transformé en normalized_brief versionné
```

### Prompt `V2-N8N-02`

```text
Tu implémentes le ticket : V2-N8N-02

Objectif :
- Produire discovery_brief à partir de normalized_brief

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- schémas existants

Écriture :
- workflow n8n de planification V2

Critères d'acceptation :
- sortie collecteur persistée en artefact versionné
```

### Prompt `V2-N8N-03`

```text
Tu implémentes le ticket : V2-N8N-03

Objectif :
- Produire site_architecture versionné

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- schemas/site_architecture.schema.json

Écriture :
- workflow n8n de planification V2

Critères d'acceptation :
- sortie architecte persistée en artefact versionné
- JSON compatible avec le schéma
```

### Prompt `V2-N8N-04`

```text
Tu implémentes le ticket : V2-N8N-04

Objectif :
- Produire content_plan, design_plan, wordpress_plan, execution_plan

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- docs/plan-v2/02-contracts-and-schemas.md
- schémas dans schemas/

Écriture :
- workflow n8n de planification V2

Contraintes :
- produire des artefacts séparés
- pas de logique d'exécution WordPress dans ce ticket

Critères d'acceptation :
- tous les artefacts du plan existent avant validation
```

## Lot Validation et révision

### Prompt `V2-N8N-05`

```text
Tu implémentes le ticket : V2-N8N-05

Objectif :
- Implémenter la boucle approve / changes_requested / reject

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- docs/wp-site-builder-v2-architecture.md

Écriture :
- workflow n8n de validation loop

Contraintes :
- ne mélange pas exécution WordPress et validation

Critères d'acceptation :
- approbation simple possible
- demande de changement possible
- rejet possible
```

### Prompt `V2-N8N-06`

```text
Tu implémentes le ticket : V2-N8N-06

Objectif :
- Implémenter la régénération ciblée

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- docs/plan-v2/02-contracts-and-schemas.md
- docs/wp-site-builder-v2-architecture.md

Écriture :
- workflow n8n de validation loop
- éventuellement workflow dédié de rebuild

Contraintes :
- cibler un artefact précis
- reconstruire les dépendances si nécessaire

Critères d'acceptation :
- régénération d'un artefact cible
- retour en validation
```

## Lot Frontend

### Prompt `V2-FE-01`

```text
Tu implémentes le ticket : V2-FE-01

Objectif :
- Ajouter une vue Pipeline

Lecture :
- docs/plan-v2/05-frontend.md
- frontend existant

Écriture :
- fichiers frontend nécessaires à la vue Pipeline

Contraintes :
- respecte les patterns existants du frontend
- ne touche pas au backend

Critères d'acceptation :
- affichage de la phase courante
- affichage des phases complétées / en attente / en erreur
```

### Prompt `V2-FE-02`

```text
Tu implémentes le ticket : V2-FE-02

Objectif :
- Ajouter une vue Artefacts

Lecture :
- docs/plan-v2/05-frontend.md
- composants frontend existants

Écriture :
- fichiers frontend nécessaires à la vue Artefacts

Critères d'acceptation :
- lecture des artefacts
- lecture des versions
```

### Prompt `V2-FE-03`

```text
Tu implémentes le ticket : V2-FE-03

Objectif :
- Ajouter une vue Validation

Lecture :
- docs/plan-v2/05-frontend.md

Écriture :
- fichiers frontend nécessaires à la vue Validation

Critères d'acceptation :
- approve
- changes_requested
- reject
```

### Prompt `V2-FE-04`

```text
Tu implémentes le ticket : V2-FE-04

Objectif :
- Ajouter une vue Révisions

Lecture :
- docs/plan-v2/05-frontend.md

Écriture :
- fichiers frontend nécessaires à la vue Révisions

Critères d'acceptation :
- comparaison entre versions
- historique des décisions
```

### Prompt `V2-FE-05`

```text
Tu implémentes le ticket : V2-FE-05

Objectif :
- Ajouter une vue Execution

Lecture :
- docs/plan-v2/05-frontend.md

Écriture :
- fichiers frontend nécessaires à la vue Execution

Critères d'acceptation :
- lecture de l'état d'exécution
- lecture des logs
```

## Lot Exécution WordPress

### Prompt `V2-EXE-01`

```text
Tu implémentes le ticket : V2-EXE-01

Objectif :
- Créer le workflow WordPress Execution

Lecture :
- docs/plan-v2/04-n8n-workflows.md
- docs/wp-site-builder-v2-architecture.md

Écriture :
- workflow n8n d'exécution

Contraintes :
- ne démarre qu'après approbation

Critères d'acceptation :
- workflow séparé du plan
```

### Prompt `V2-EXE-02`

```text
Tu implémentes le ticket : V2-EXE-02

Objectif :
- Suivre les étapes d'exécution individuellement

Lecture :
- docs/wp-site-builder-v2-architecture.md
- modèles RequestExecution existants

Écriture :
- backend et/ou workflow strictement nécessaires au suivi des steps

Critères d'acceptation :
- chaque étape a un statut distinct
- reprise possible à partir d'un état connu
```

### Prompt `V2-EXE-03`

```text
Tu implémentes le ticket : V2-EXE-03

Objectif :
- Gérer resume, compensate, manual_intervention_required

Lecture :
- docs/wp-site-builder-v2-architecture.md

Écriture :
- backend / services d'exécution strictement nécessaires

Contraintes :
- ne fais pas de refactor global
- cible seulement la classification et la mécanique d'échec partiel

Critères d'acceptation :
- une exécution partiellement échouée peut être classée proprement
```

## Lot Observabilité

### Prompt `V2-OBS-01`

```text
Tu implémentes le ticket : V2-OBS-01

Objectif :
- Ajouter des logs structurés par phase

Lecture :
- docs/wp-site-builder-v2-architecture.md
- backend bridge existant

Écriture :
- fichiers backend nécessaires à l'instrumentation

Critères d'acceptation :
- request_id, phase, artifact_type, version, duration_ms, status présents
```

### Prompt `V2-OBS-02`

```text
Tu implémentes le ticket : V2-OBS-02

Objectif :
- Exposer des métriques pipeline

Lecture :
- docs/wp-site-builder-v2-architecture.md
- backend observabilité existant

Écriture :
- backend métriques uniquement

Critères d'acceptation :
- temps moyen par phase
- taux d'échec par phase
- nombre de révisions
```

### Prompt `V2-OBS-03`

```text
Tu implémentes le ticket : V2-OBS-03

Objectif :
- Produire un rapport d'audit final

Lecture :
- docs/wp-site-builder-v2-architecture.md
- modèles RequestExecution / artifacts / decisions

Écriture :
- backend reporting uniquement

Critères d'acceptation :
- artefacts utilisés
- décisions humaines
- temps par phase
- résultat final
```

## Conseil de lancement

Ordre pratique après les 3 premiers prompts :

1. `V2-DB-03`
2. `V2-DB-04`
3. `V2-BE-02`
4. `V2-BE-03`
5. `V2-BE-04`
6. `V2-BE-05`
7. `V2-N8N-01` à `V2-N8N-04`
8. `V2-FE-02` et `V2-FE-03`
9. `V2-N8N-05`
10. `V2-N8N-06`

Complément backend exécution :

- `V2-BE-07` avant les tickets d'exécution avancée
