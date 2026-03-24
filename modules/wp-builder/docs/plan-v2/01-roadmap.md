# Roadmap V2

## Cible

La V2 doit être livrée en plusieurs incréments compatibles avec la V1.

## Lots

### Lot 1 : Contrats et schémas

Livrer :

- schémas JSON pour tous les artefacts
- conventions de versionnement
- graphe de dépendances

Sortie attendue :

- un dossier `schemas/` complet
- un validateur backend branché

### Lot 2 : Stockage des artefacts

Livrer :

- modèle `RequestArtifact`
- modèle `ValidationDecision`
- modèle `RequestExecution`
- lecture et écriture des artefacts

Sortie attendue :

- endpoints backend de base
- persistance versionnée

### Lot 3 : Pipeline de planification

Livrer :

- workflow n8n de génération du plan
- artefacts `normalized_brief`, `discovery_brief`, `site_architecture`, `content_plan`, `design_plan`, `wordpress_plan`, `execution_plan`

Sortie attendue :

- plan complet stocké sans exécution WordPress

### Lot 4 : Validation et révision

Livrer :

- boucle `approve / changes_requested / reject`
- régénération ciblée
- recalcul des dépendances

Sortie attendue :

- nouvelle version d'artefact après demande de changement

### Lot 5 : Frontend V2

Livrer :

- vue pipeline
- vue artefacts
- vue validation
- vue révisions

Sortie attendue :

- UI navigable de bout en bout

### Lot 6 : Exécution WordPress

Livrer :

- workflow d'exécution distinct
- `RequestExecution`
- rapport d'exécution
- reprise / compensation

Sortie attendue :

- exécution séparée du plan

### Lot 7 : Observabilité

Livrer :

- logs structurés
- métriques
- erreurs par phase
- audit final

## Dépendances

Ordre logique :

1. `contracts -> backend -> n8n plan -> frontend validation -> execution -> observability`

## Critères de fin V2

La V2 est considérée exploitable quand :

- un plan complet est généré et stocké en artefacts
- une validation humaine peut demander des changements
- une nouvelle version d'artefact est régénérée
- le plan approuvé peut être exécuté dans un workflow séparé
- le frontend expose les phases, artefacts et décisions
