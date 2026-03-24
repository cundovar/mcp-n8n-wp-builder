# Agent Work Packages

## But

Découper la refactorisation V2 en lots clairs pour agents IA.

## Lot A : Contrats et schémas

Périmètre :

- dossier `schemas/`
- service de validation
- documentation des contrats

Fichiers typiques :

- `schemas/*.schema.json`
- `bridge/src/services/artifact-validator.js`

Critère de fin :

- validation d'un artefact par type

## Lot B : Modèles Mongo et persistance

Périmètre :

- `RequestArtifact`
- `ValidationDecision`
- `RequestExecution`

Fichiers typiques :

- `bridge/src/db/models/*`
- `bridge/src/services/artifact-store.js`

Critère de fin :

- lecture / écriture d'un artefact versionné

## Lot C : Routes backend V2

Périmètre :

- routes artefacts
- routes validation
- routes exécution

Fichiers typiques :

- `bridge/src/routes/artifacts.js`
- `bridge/src/routes/validations.js`
- `bridge/src/routes/executions.js`

Critère de fin :

- API testable par `curl`

## Lot D : n8n Plan Generation

Périmètre :

- workflow de génération du plan
- stockage intermédiaire bridge

Critère de fin :

- production de `execution_plan` sans exécution WordPress

## Lot E : n8n Validation Loop

Périmètre :

- approbation
- rejet
- changements demandés
- régénération ciblée

Critère de fin :

- nouvelle version d'artefact après `changes_requested`

## Lot F : n8n WordPress Execution

Périmètre :

- workflow d'exécution
- rapport
- reprise / compensation

Critère de fin :

- exécution séparée du plan

## Lot G : Frontend V2

Périmètre :

- pipeline
- artefacts
- validation
- révisions
- exécution

Critère de fin :

- parcours utilisateur V2 visible de bout en bout

## Règles d'attribution par agent

- ne pas mélanger backend Mongo et frontend dans le même lot si ce n'est pas nécessaire
- donner à chaque agent un périmètre de fichiers disjoint
- faire valider les contrats avant d'attaquer les workflows n8n
- ne pas lancer l'exécution WordPress tant que la boucle de validation n'est pas stable
