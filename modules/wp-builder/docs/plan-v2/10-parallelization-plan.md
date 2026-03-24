# Parallelization Plan

Ce fichier indique quels tickets peuvent être lancés en parallèle sans générer trop de conflits de fichiers ou de dépendances.

Objectif :

- accélérer la refactorisation
- éviter les collisions entre agents IA
- conserver un ordre d'intégration lisible

## Principes

Un ticket peut être parallélisé si :

- il n'écrit pas dans les mêmes fichiers qu'un autre ticket
- il ne dépend pas d'un résultat métier encore incertain
- ses critères d'acceptation ne supposent pas l'existence d'une implémentation non livrée

Un ticket ne doit pas être parallélisé si :

- il modifie les mêmes routes backend
- il modifie le même workflow n8n
- il dépend fortement d'un modèle de données encore instable

## Vue synthétique

### Phase 1 : fondations

Parallélisable :

- `V2-SCH-01`
- `V2-DB-01`
- `V2-DB-02`
- `V2-DB-03`

Pourquoi :

- schémas et modèles distincts
- peu ou pas de chevauchement de fichiers

À faire ensuite :

- `V2-DB-04`
- `V2-SCH-02`

### Phase 2 : services backend

Parallélisable :

- `V2-BE-01`
- `V2-BE-02`

Sous condition :

- les modèles Mongo de base existent

À ne pas lancer en parallèle trop tôt :

- `V2-SCH-03`

Pourquoi :

- `V2-SCH-03` dépend directement de `artifact-store`

### Phase 3 : routes backend

Parallélisable avec prudence :

- `V2-BE-03`
- `V2-BE-04`

Pourquoi :

- même zone backend
- possible conflit si deux agents modifient `bridge/src/routes/artifacts.js`

Recommandation :

- soit un seul agent prend `V2-BE-03` et `V2-BE-04`
- soit on séquence les deux tickets

À séquencer ensuite :

- `V2-BE-05`
- `V2-BE-06`

Pourquoi :

- impact sur validation et orchestration

### Phase 4 : n8n plan generation

À lancer en série :

- `V2-N8N-01`
- `V2-N8N-02`
- `V2-N8N-03`
- `V2-N8N-04`

Pourquoi :

- forte dépendance logique
- forte probabilité de conflit si plusieurs agents éditent le même workflow

### Phase 5 : frontend lecture

Parallélisable :

- `V2-FE-01`
- `V2-FE-02`

Sous condition :

- les endpoints backend de lecture existent

Recommandation :

- paralléliser seulement si les composants sont séparés

### Phase 6 : validation / révisions

À séquencer :

- `V2-BE-05`
- `V2-FE-03`
- `V2-N8N-05`
- `V2-BE-06`
- `V2-FE-04`
- `V2-N8N-06`

Pourquoi :

- logique métier très couplée
- dépendances croisées entre backend, frontend et n8n

### Phase 7 : exécution WordPress

Parallélisable partiellement :

- `V2-EXE-01`
- `V2-EXE-02`

Sous condition :

- `V2-EXE-02` doit viser le suivi, pas la définition métier du workflow

À laisser pour la fin :

- `V2-EXE-03`

Pourquoi :

- ticket très dépendant de la forme finale de l'exécution

### Phase 8 : observabilité

Parallélisable en fin de chantier :

- `V2-OBS-01`
- `V2-OBS-02`
- `V2-OBS-03`

Sous condition :

- le pipeline principal est stable

## Plan pratique par vagues

## Vague 1

Lancer en parallèle :

- `V2-SCH-01`
- `V2-DB-01`
- `V2-DB-02`
- `V2-DB-03`

Puis intégrer :

- `V2-DB-04`
- `V2-SCH-02`

## Vague 2

Lancer :

- `V2-BE-01`
- `V2-BE-02`

Puis intégrer :

- `V2-SCH-03`

## Vague 3

Lancer :

- `V2-BE-03` puis `V2-BE-04`

Puis :

- `V2-BE-05`

Puis :

- `V2-BE-06`

## Vague 4

Lancer en série :

- `V2-N8N-01`
- `V2-N8N-02`
- `V2-N8N-03`
- `V2-N8N-04`

## Vague 5

Lancer en parallèle modérée :

- `V2-FE-01`
- `V2-FE-02`

Puis :

- `V2-FE-03`

## Vague 6

Lancer en série :

- `V2-N8N-05`
- `V2-FE-04`
- `V2-N8N-06`

## Vague 7

Lancer :

- `V2-EXE-01`
- `V2-EXE-02`

Puis :

- `V2-EXE-03`

## Vague 8

Lancer en parallèle :

- `V2-OBS-01`
- `V2-OBS-02`
- `V2-OBS-03`

## Tableau de compatibilité rapide

### Compatibles immédiatement

- `V2-SCH-01` + `V2-DB-01`
- `V2-SCH-01` + `V2-DB-02`
- `V2-SCH-01` + `V2-DB-03`
- `V2-DB-01` + `V2-DB-02`
- `V2-DB-01` + `V2-DB-03`
- `V2-BE-01` + `V2-BE-02`
- `V2-FE-01` + `V2-FE-02`
- `V2-OBS-01` + `V2-OBS-02`

### Compatibles avec prudence

- `V2-BE-03` + `V2-BE-04`
- `V2-EXE-01` + `V2-EXE-02`

### À éviter en parallèle

- `V2-N8N-01` avec `V2-N8N-02`
- `V2-N8N-02` avec `V2-N8N-03`
- `V2-N8N-03` avec `V2-N8N-04`
- `V2-N8N-05` avec `V2-N8N-06`
- `V2-BE-05` avec `V2-BE-06`
- `V2-EXE-03` avec n'importe quel ticket d'exécution encore instable

## Recommandation finale

Si tu pilotes plusieurs agents IA :

- utiliser 2 à 4 agents maximum au début
- commencer par les fondations
- éviter de paralléliser n8n trop tôt
- centraliser l'intégration des tickets backend avant de lancer les tickets frontend avancés

Le meilleur rendement est généralement :

1. un agent schémas
2. un agent modèles Mongo
3. un agent backend services
4. un agent frontend, mais seulement après stabilisation des endpoints de lecture
