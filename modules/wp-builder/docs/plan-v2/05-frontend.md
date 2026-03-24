# Frontend V2

## But

Faire du frontend un outil de pilotage du pipeline, pas seulement un formulaire + un bouton de validation.

## Écrans cibles

### `Demandes`

Afficher :

- statut global
- phase courante
- dernière décision

### `Pipeline`

Afficher :

- timeline des phases
- statut de chaque phase
- erreurs éventuelles

### `Artefacts`

Afficher :

- liste des artefacts disponibles
- version active
- historique des versions

### `Validation`

Permettre :

- `approve`
- `changes_requested`
- `reject`

### `Révisions`

Afficher :

- décision humaine
- commentaire
- demandes de changements
- lien vers version précédente et suivante

### `Execution`

Afficher :

- exécution WordPress en cours
- logs
- rapport final

## États UI à gérer

- `waiting_validation`
- `changes_requested`
- `revising`
- `approved`
- `executing`
- `failed_partial`
- `completed`

## Critères d'acceptation

- l'utilisateur peut voir quelle version d'artefact il valide
- l'utilisateur peut comparer deux versions
- l'utilisateur peut demander des changements ciblés
- l'exécution WordPress a une vue dédiée
