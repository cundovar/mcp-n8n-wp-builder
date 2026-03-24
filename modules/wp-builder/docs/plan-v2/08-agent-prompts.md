# Agent Prompts

Ce fichier fournit :

- un template réutilisable pour cadrer un agent IA
- les 3 premiers prompts recommandés pour démarrer la V2

## Règles d'utilisation

Chaque agent doit recevoir :

- un ticket unique
- un périmètre de fichiers clair
- des critères d'acceptation vérifiables
- un livrable concret

À éviter :

- demander plusieurs tickets à la fois
- mélanger backend, frontend et n8n dans le même prompt
- laisser l'agent modifier des fichiers hors périmètre

## Template réutilisable

```text
Tu implémentes le ticket : <TICKET_ID>

Contexte :
- Projet : WP Site Builder V2
- Référence principale : docs/plan-v2/07-executable-backlog.md
- Références complémentaires :
  - <DOC_1>
  - <DOC_2>

Objectif :
- <objectif concret du ticket>

Périmètre autorisé :
- Lecture :
  - <fichiers à lire>
- Écriture :
  - <fichiers à modifier uniquement>

Contraintes :
- Ne touche à aucun autre fichier
- Ne fais pas de refactor hors périmètre
- Respecte l'architecture existante
- Garde la compatibilité V1 si demandé
- Si une hypothèse est nécessaire, choisis l'option la plus conservative

Critères d'acceptation :
- <critère 1>
- <critère 2>
- <critère 3>

Vérifications attendues :
- <import/test/build minimal>

Livrable attendu :
- liste des fichiers modifiés
- résumé très court
- points de vigilance éventuels
```

## Ordre recommandé de démarrage

Les 3 premiers tickets à lancer sont :

1. `V2-DB-01` Créer le modèle `RequestArtifact`
2. `V2-DB-02` Créer le modèle `ValidationDecision`
3. `V2-BE-01` Créer le service `artifact-store`

Raison :

- ils posent la base de persistance V2
- ils sont peu dépendants du frontend et de n8n
- ils permettent ensuite d'ouvrir les routes et les workflows sur des fondations stables

## Prompt 1 : `V2-DB-01`

```text
Tu implémentes le ticket : V2-DB-01

Contexte :
- Projet : WP Site Builder V2
- Référence principale : docs/plan-v2/07-executable-backlog.md
- Références complémentaires :
  - docs/plan-v2/03-bridge-backend.md
  - docs/wp-site-builder-v2-architecture.md

Objectif :
- Créer le modèle Mongo `RequestArtifact`

Périmètre autorisé :
- Lecture :
  - bridge/src/db/models/Request.js
  - docs/plan-v2/03-bridge-backend.md
  - docs/plan-v2/07-executable-backlog.md
- Écriture :
  - bridge/src/db/models/RequestArtifact.js

Contraintes :
- Utiliser Mongoose en ESM
- Ajouter les index utiles
- Ne touche à aucun autre fichier
- Ne fais pas de refactor annexe

Champs attendus :
- requestId
- artifact_type
- version
- status
- payload
- source_artifacts
- generator
- created_at

Critères d'acceptation :
- Plusieurs versions d'un même artefact peuvent coexister
- Index sur `(requestId, artifact_type, version)`
- Index sur `(requestId, artifact_type, status)`
- Le modèle s'importe sans erreur

Vérifications attendues :
- import Node du modèle sans erreur

Livrable attendu :
- fichier créé
- résumé très court
- hypothèses éventuelles
```

## Prompt 2 : `V2-DB-02`

```text
Tu implémentes le ticket : V2-DB-02

Contexte :
- Projet : WP Site Builder V2
- Référence principale : docs/plan-v2/07-executable-backlog.md
- Références complémentaires :
  - docs/plan-v2/03-bridge-backend.md
  - docs/wp-site-builder-v2-architecture.md

Objectif :
- Créer le modèle Mongo `ValidationDecision`

Périmètre autorisé :
- Lecture :
  - bridge/src/db/models/Request.js
  - docs/plan-v2/03-bridge-backend.md
  - docs/plan-v2/07-executable-backlog.md
- Écriture :
  - bridge/src/db/models/ValidationDecision.js

Contraintes :
- Utiliser Mongoose en ESM
- Ne touche à aucun autre fichier
- Prévoir les valeurs `approved`, `changes_requested`, `rejected`

Champs attendus :
- requestId
- artifact_type
- artifact_version
- decision
- comment
- requested_changes
- created_by
- created_at

Critères d'acceptation :
- Une décision cible explicitement un artefact et une version
- Les décisions supportées sont limitées au bon enum
- Le modèle s'importe sans erreur

Vérifications attendues :
- import Node du modèle sans erreur

Livrable attendu :
- fichier créé
- résumé très court
- hypothèses éventuelles
```

## Prompt 3 : `V2-BE-01`

```text
Tu implémentes le ticket : V2-BE-01

Contexte :
- Projet : WP Site Builder V2
- Référence principale : docs/plan-v2/07-executable-backlog.md
- Références complémentaires :
  - docs/plan-v2/03-bridge-backend.md
  - docs/plan-v2/02-contracts-and-schemas.md
  - docs/wp-site-builder-v2-architecture.md

Objectif :
- Créer le service `artifact-store`

Périmètre autorisé :
- Lecture :
  - bridge/src/services/artifact-validator.js
  - bridge/src/db/models/Request.js
  - bridge/src/db/models/RequestArtifact.js
  - docs/plan-v2/03-bridge-backend.md
  - docs/plan-v2/07-executable-backlog.md
- Écriture :
  - bridge/src/services/artifact-store.js

Contraintes :
- Ne touche à aucun autre fichier
- Le service doit rester simple et réutilisable
- Il doit être compatible avec la validation par schéma existante

Fonctions attendues :
- créer un artefact
- lister les artefacts d'une demande
- récupérer la version active d'un type
- lister les versions d'un type

Critères d'acceptation :
- Un artefact valide peut être stocké
- Les versions sont ordonnées proprement
- La version active d'un type peut être retrouvée
- Le service s'importe sans erreur

Vérifications attendues :
- import Node du service sans erreur

Livrable attendu :
- fichier créé
- résumé très court
- hypothèses éventuelles
```

## Conseils de pilotage

### Ce qui peut être lancé en parallèle

- `V2-DB-01`
- `V2-DB-02`

### Ce qui doit attendre

- `V2-BE-01` doit attendre au moins `V2-DB-01`

### Revue avant intégration

Avant d'intégrer la sortie d'un agent :

- vérifier le périmètre de fichiers
- vérifier que les noms de champs correspondent à la doc
- vérifier l'import Node minimal
- vérifier que l'agent n'a pas fait de refactor hors ticket
