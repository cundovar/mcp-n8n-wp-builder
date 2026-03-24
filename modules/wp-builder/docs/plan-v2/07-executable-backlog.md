# Executable Backlog

Ce backlog transforme la vision V2 en unités de travail directement actionnables.

Chaque ticket contient :

- un identifiant stable
- une priorité
- une complexité
- des dépendances
- un périmètre de fichiers
- des critères d'acceptation
- un type d'agent recommandé

## Convention

Préfixes :

- `V2-BE-*` : backend bridge
- `V2-DB-*` : modèles Mongo
- `V2-SCH-*` : schémas et validation
- `V2-N8N-*` : workflows n8n
- `V2-FE-*` : frontend
- `V2-OBS-*` : observabilité
- `V2-EXE-*` : exécution WordPress

Complexité :

- `S` : petite
- `M` : moyenne
- `L` : grande
- `XL` : très grande

## Lot 1 : Schémas et validation

### V2-SCH-01

Titre : Compléter tous les schémas JSON manquants

Priorité : Haute

Complexité : M

Dépend de : rien

Fichiers :

- `schemas/normalized_brief.schema.json`
- `schemas/discovery_brief.schema.json`
- `schemas/design_plan.schema.json`
- `schemas/execution_report.schema.json`

Critères d'acceptation :

- tous les artefacts cibles ont un schéma dédié
- chaque schéma a `contract_version`, `request_id`, `stage`, `payload`
- les schémas sont cohérents avec la doc V2

Agent recommandé :

- backend / schema

### V2-SCH-02

Titre : Introduire un registre de schémas côté bridge

Priorité : Haute

Complexité : M

Dépend de :

- `V2-SCH-01`

Fichiers :

- `bridge/src/services/artifact-validator.js`
- éventuellement `bridge/src/services/schema-registry.js`

Critères d'acceptation :

- le bridge peut lister les types supportés
- le bridge charge les schémas automatiquement
- le bridge renvoie une erreur structurée si le type est inconnu

Agent recommandé :

- backend / schema

### V2-SCH-03

Titre : Valider les artefacts avant stockage

Priorité : Haute

Complexité : M

Dépend de :

- `V2-SCH-02`

Fichiers :

- `bridge/src/services/artifact-store.js`
- routes d'écriture d'artefacts

Critères d'acceptation :

- un artefact invalide n'est pas stocké comme version active
- les erreurs de validation sont persistées

Agent recommandé :

- backend / validation

## Lot 2 : Modèles Mongo

### V2-DB-01

Titre : Créer le modèle `RequestArtifact`

Priorité : Haute

Complexité : M

Dépend de : rien

Fichiers :

- `bridge/src/db/models/RequestArtifact.js`

Champs attendus :

- `requestId`
- `artifact_type`
- `version`
- `status`
- `payload`
- `source_artifacts`
- `generator`
- `created_at`

Critères d'acceptation :

- plusieurs versions d'un même artefact peuvent coexister
- index sur `(requestId, artifact_type, version)`
- index sur `(requestId, artifact_type, status)`

Agent recommandé :

- backend / data model

### V2-DB-02

Titre : Créer le modèle `ValidationDecision`

Priorité : Haute

Complexité : S

Dépend de : rien

Fichiers :

- `bridge/src/db/models/ValidationDecision.js`

Critères d'acceptation :

- stockage de `approved`, `changes_requested`, `rejected`
- une décision cible un artefact et une version

Agent recommandé :

- backend / data model

### V2-DB-03

Titre : Créer le modèle `RequestExecution`

Priorité : Haute

Complexité : M

Dépend de : rien

Fichiers :

- `bridge/src/db/models/RequestExecution.js`

Critères d'acceptation :

- une exécution WordPress est distincte de la demande
- les étapes d'exécution peuvent être suivies

Agent recommandé :

- backend / data model

### V2-DB-04

Titre : Étendre `Request` avec pipeline et validation V2

Priorité : Haute

Complexité : M

Dépend de : rien

Fichiers :

- `bridge/src/db/models/Request.js`

Critères d'acceptation :

- `current_phase` disponible
- `pipeline.phases` disponible
- `validation.target_artifact` et `validation.target_version` disponibles
- compatibilité V1 conservée

Agent recommandé :

- backend / data model

## Lot 3 : Backend bridge

### V2-BE-01

Titre : Créer le service `artifact-store`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-DB-01`
- `V2-SCH-03`

Fichiers :

- `bridge/src/services/artifact-store.js`

Critères d'acceptation :

- un artefact peut être créé
- une version active peut être retrouvée
- les versions sont ordonnées proprement

Agent recommandé :

- backend / service

### V2-BE-02

Titre : Créer le service `dependency-graph`

Priorité : Haute

Complexité : L

Dépend de :

- `V2-DB-01`

Fichiers :

- `bridge/src/services/dependency-graph.js`

Critères d'acceptation :

- calcul des dépendances directes
- marquage `stale` des descendants
- reconstruction ordonnée possible

Agent recommandé :

- backend / service

### V2-BE-03

Titre : Exposer `GET /requests/:id/artifacts`

Priorité : Haute

Complexité : S

Dépend de :

- `V2-BE-01`

Fichiers :

- `bridge/src/routes/artifacts.js`

Critères d'acceptation :

- liste des artefacts d'une demande
- lecture lisible par type et version

Agent recommandé :

- backend / API

### V2-BE-04

Titre : Exposer `GET /requests/:id/artifacts/:type/versions`

Priorité : Haute

Complexité : S

Dépend de :

- `V2-BE-01`

Critères d'acceptation :

- historique complet des versions d'un artefact

Agent recommandé :

- backend / API

### V2-BE-05

Titre : Exposer `POST /requests/:id/validation-decisions`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-DB-02`
- `V2-DB-04`

Fichiers :

- `bridge/src/routes/validations.js`
- `bridge/src/services/validation-decision-service.js`

Critères d'acceptation :

- une décision humaine est stockée
- `changes_requested` cible un artefact précis
- `Request.validation` est mis à jour

Agent recommandé :

- backend / API

### V2-BE-06

Titre : Exposer `POST /requests/:id/artifacts/:type/:version/revise`

Priorité : Haute

Complexité : L

Dépend de :

- `V2-BE-02`
- `V2-BE-05`

Critères d'acceptation :

- déclenchement d'une régénération ciblée
- marquage `stale` des artefacts dépendants

Agent recommandé :

- backend / orchestration

### V2-BE-07

Titre : Exposer les routes d'exécution

Priorité : Haute

Complexité : M

Dépend de :

- `V2-DB-03`

Fichiers :

- `bridge/src/routes/executions.js`
- `bridge/src/server.js`
- services backend strictement nécessaires

Critères d'acceptation :

- `POST /requests/:id/executions` existe
- `GET /requests/:id/executions` existe
- `GET /requests/:id/executions/:executionId` existe
- lecture d'une exécution WordPress distincte de la demande

Agent recommandé :

- backend / API

## Lot 4 : n8n Plan Generation

### V2-N8N-01

Titre : Produire `normalized_brief`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-BE-01`

Critères d'acceptation :

- le brief brut est stocké comme artefact normalisé

Agent recommandé :

- n8n / workflow

### V2-N8N-02

Titre : Produire `discovery_brief`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-N8N-01`

Critères d'acceptation :

- sortie collecteur persistée en artefact versionné

Agent recommandé :

- n8n / workflow

### V2-N8N-03

Titre : Produire `site_architecture`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-N8N-02`

Critères d'acceptation :

- sortie architecte persistée en artefact versionné

Agent recommandé :

- n8n / workflow

### V2-N8N-04

Titre : Produire `content_plan`, `design_plan`, `wordpress_plan`, `execution_plan`

Priorité : Haute

Complexité : L

Dépend de :

- `V2-N8N-03`

Critères d'acceptation :

- tous les artefacts du plan existent avant validation

Agent recommandé :

- n8n / workflow

## Lot 5 : Validation et révision

### V2-N8N-05

Titre : Implémenter la boucle `approve / changes_requested / reject`

Priorité : Haute

Complexité : L

Dépend de :

- `V2-BE-05`
- `V2-N8N-04`

Critères d'acceptation :

- approbation simple possible
- demande de changement possible
- rejet possible

Agent recommandé :

- n8n / orchestration

### V2-N8N-06

Titre : Implémenter la régénération ciblée

Priorité : Haute

Complexité : XL

Dépend de :

- `V2-BE-06`
- `V2-N8N-05`

Critères d'acceptation :

- régénération d'un artefact cible
- reconstruction des dépendances si nécessaire
- retour en validation

Agent recommandé :

- n8n / orchestration avancée

## Lot 6 : Frontend V2

### V2-FE-01

Titre : Ajouter une vue `Pipeline`

Priorité : Moyenne

Complexité : M

Dépend de :

- endpoints backend pipeline

Critères d'acceptation :

- affichage de la phase courante
- affichage des phases complétées / en attente / en erreur

Agent recommandé :

- frontend

### V2-FE-02

Titre : Ajouter une vue `Artefacts`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-BE-03`
- `V2-BE-04`

Critères d'acceptation :

- lecture des artefacts
- lecture des versions

Agent recommandé :

- frontend

### V2-FE-03

Titre : Ajouter une vue `Validation`

Priorité : Haute

Complexité : M

Dépend de :

- `V2-BE-05`

Critères d'acceptation :

- approbation
- demande de changement
- rejet

Agent recommandé :

- frontend

### V2-FE-04

Titre : Ajouter une vue `Révisions`

Priorité : Moyenne

Complexité : M

Dépend de :

- `V2-BE-04`
- `V2-BE-05`

Critères d'acceptation :

- comparaison entre versions
- historique des décisions

Agent recommandé :

- frontend

### V2-FE-05

Titre : Ajouter une vue `Execution`

Priorité : Moyenne

Complexité : M

Dépend de :

- `V2-DB-03`
- endpoints exécution

Critères d'acceptation :

- lecture de l'état d'exécution
- lecture des logs

Agent recommandé :

- frontend

## Lot 7 : Exécution WordPress

### V2-EXE-01

Titre : Créer le workflow `WordPress Execution`

Priorité : Haute

Complexité : L

Dépend de :

- `V2-N8N-04`
- `V2-DB-03`

Critères d'acceptation :

- l'exécution WordPress démarre seulement après approbation

Agent recommandé :

- n8n / execution

### V2-EXE-02

Titre : Suivre les étapes d'exécution individuellement

Priorité : Haute

Complexité : L

Dépend de :

- `V2-EXE-01`

Critères d'acceptation :

- chaque étape a un statut distinct
- reprise possible à partir d'un état connu

Agent recommandé :

- backend / execution

### V2-EXE-03

Titre : Gérer `resume`, `compensate`, `manual_intervention_required`

Priorité : Moyenne

Complexité : XL

Dépend de :

- `V2-EXE-02`

Critères d'acceptation :

- une exécution partiellement échouée peut être classée proprement

Agent recommandé :

- backend / execution advanced

## Lot 8 : Observabilité

### V2-OBS-01

Titre : Ajouter des logs structurés par phase

Priorité : Moyenne

Complexité : M

Dépend de :

- lots backend principaux

Critères d'acceptation :

- `request_id`, `phase`, `artifact_type`, `version`, `duration_ms`, `status` présents

Agent recommandé :

- backend / observability

### V2-OBS-02

Titre : Exposer des métriques pipeline

Priorité : Moyenne

Complexité : M

Dépend de :

- `V2-OBS-01`

Critères d'acceptation :

- temps moyen par phase
- taux d'échec par phase
- nombre de révisions

Agent recommandé :

- backend / observability

### V2-OBS-03

Titre : Produire un rapport d'audit final

Priorité : Moyenne

Complexité : M

Dépend de :

- `V2-EXE-02`
- `V2-OBS-01`

Critères d'acceptation :

- artefacts utilisés
- décisions humaines
- temps par phase
- résultat final

Agent recommandé :

- backend / reporting

## Ordre recommandé d'exécution

Ordre conseillé :

1. `V2-SCH-*`
2. `V2-DB-*`
3. `V2-BE-01` à `V2-BE-05`
4. `V2-BE-06` et `V2-BE-07`
5. `V2-N8N-01` à `V2-N8N-04`
6. `V2-FE-02` et `V2-FE-03`
7. `V2-N8N-05` et `V2-N8N-06`
8. `V2-FE-01` et `V2-FE-04`
9. `V2-EXE-*`
10. `V2-OBS-*`

## Travail parallélisable

Peut être fait en parallèle :

- `V2-SCH-01` et `V2-DB-01/02/03`
- `V2-FE-01` et `V2-FE-02` une fois les endpoints fixés
- `V2-OBS-01` après stabilisation des services backend

Ne doit pas être parallélisé trop tôt :

- `V2-N8N-06`
- `V2-EXE-03`

Ces tickets dépendent trop de l'état réel des lots précédents.
