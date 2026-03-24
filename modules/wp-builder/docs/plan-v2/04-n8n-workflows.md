# n8n Workflows

## But

Sortir du workflow monolithique actuel et distribuer les responsabilités.

## Workflow 1 : Plan Generation

Responsabilité :

- produire tous les artefacts métier

Étapes cibles :

- `normalized_brief`
- `discovery_brief`
- `site_architecture`
- `content_plan`
- `design_plan`
- `wordpress_plan`
- `execution_plan`

Sortie :

- artefacts persistés côté bridge
- demande en `waiting_validation`

## Workflow 2 : Validation Loop

Responsabilité :

- recevoir la décision humaine
- approuver
- rejeter
- demander une révision

Cas `changes_requested` :

- identifier l'artefact cible
- relancer la phase correspondante
- recalculer les artefacts dépendants
- repousser la demande en validation

## Workflow 3 : WordPress Execution

Responsabilité :

- exécuter seulement après approbation

Étapes cibles :

- préparation environnement
- création pages
- configuration options
- installation plugins / thème
- injection contenus
- vérifications

Sortie :

- `execution_report`

## Workflow 4 : Execution Audit

Responsabilité :

- agréger statut, erreurs, logs et résultat final

## Règles de conception

- chaque workflow doit avoir un rôle clair
- les artefacts intermédiaires doivent être stockés côté bridge
- le callback final ne doit plus être le seul point de persistance
- la validation humaine doit cibler des artefacts versionnés

## Critères d'acceptation

- un changement demandé sur `site_architecture` ne relance pas tout le pipeline si ce n'est pas nécessaire
- l'exécution WordPress peut être démarrée indépendamment d'une nouvelle génération de plan
