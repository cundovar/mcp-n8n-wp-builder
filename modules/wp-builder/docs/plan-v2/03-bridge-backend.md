# Bridge Backend

## But

Faire du bridge la source de vérité de la V2.

## Modèles Mongo à introduire

### `Request`

Ajouter :

- `current_phase`
- `pipeline.phases`
- `validation.status`
- `validation.target_artifact`
- `validation.target_version`

### `RequestArtifact`

Champs attendus :

- `requestId`
- `artifact_type`
- `version`
- `status`
- `payload`
- `source_artifacts`
- `generator`
- `created_at`

### `ValidationDecision`

Champs attendus :

- `requestId`
- `artifact_type`
- `artifact_version`
- `decision`
- `comment`
- `requested_changes`
- `created_by`
- `created_at`

### `RequestExecution`

Champs attendus :

- `requestId`
- `execution_id`
- `mode`
- `status`
- `plan_version`
- `steps`
- `logs`
- `result`

## Endpoints à ajouter

### Artefacts

- `GET /schemas`
- `POST /artifacts/validate`
- `GET /requests/:id/artifacts`
- `GET /requests/:id/artifacts/:type`
- `GET /requests/:id/artifacts/:type/versions`

### Validation

- `POST /requests/:id/validation-decisions`
- `GET /requests/:id/validation-decisions`
- `POST /requests/:id/artifacts/:type/:version/revise`

### Exécution

- `POST /requests/:id/executions`
- `GET /requests/:id/executions`
- `GET /requests/:id/executions/:executionId`

## Services backend à créer

- `artifact-validator`
- `artifact-store`
- `artifact-dependency-graph`
- `validation-decision-service`
- `execution-service`
- `audit-service`

## Fichiers probables

- `bridge/src/db/models/RequestArtifact.js`
- `bridge/src/db/models/ValidationDecision.js`
- `bridge/src/db/models/RequestExecution.js`
- `bridge/src/routes/artifacts.js`
- `bridge/src/routes/validations.js`
- `bridge/src/routes/executions.js`
- `bridge/src/services/artifact-store.js`
- `bridge/src/services/dependency-graph.js`

## Critères d'acceptation

- un artefact peut être stocké et relu par type/version
- une décision humaine peut être stockée
- une décision `changes_requested` peut cibler un artefact précis
- une exécution WordPress est suivie séparément du plan
