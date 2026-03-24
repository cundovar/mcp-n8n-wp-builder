# Contrats And Schemas

## But

Définir les artefacts du pipeline, leurs dépendances et leur validation.

## Artefacts cibles

- `normalized_brief`
- `discovery_brief`
- `site_architecture`
- `content_plan`
- `design_plan`
- `wordpress_plan`
- `execution_plan`
- `execution_report`

## Format canonique

```json
{
  "contract_version": "1.0",
  "request_id": "uuid",
  "stage": "site_architecture",
  "payload": {}
}
```

## Fichiers attendus

Dans `schemas/` :

- `normalized_brief.schema.json`
- `discovery_brief.schema.json`
- `site_architecture.schema.json`
- `content_plan.schema.json`
- `design_plan.schema.json`
- `wordpress_plan.schema.json`
- `execution_plan.schema.json`
- `execution_report.schema.json`

## Graphe de dépendances

```text
normalized_brief
   ->
discovery_brief
   ->
site_architecture
   ->
content_plan
   ->
wordpress_plan
   ->
execution_plan

site_architecture
   ->
design_plan
   ->
execution_plan
```

## Règles de versionnement

- chaque artefact est versionné indépendamment
- chaque version stocke `source_artifacts`
- un artefact dépendant devient `stale` si une de ses sources change

## Livrables techniques

- compléter les schémas manquants
- ajouter un validateur réutilisable
- valider :
  - après sortie agent
  - avant stockage
  - avant consommation par une phase aval

## Critères d'acceptation

- un artefact invalide retourne une erreur exploitable
- les erreurs de validation sont structurées
- les dépendances directes sont stockées avec chaque artefact
