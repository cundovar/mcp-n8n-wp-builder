# Validation Et Révisions V2

Cette doc décrit comment implémenter proprement la logique suivante :

- une demande arrive en validation initiale
- un humain peut approuver, rejeter, ou demander des changements
- si des changements sont demandés, le pipeline reconstruit une nouvelle version
- la demande revient en validation
- le frontend doit montrer clairement s'il s'agit :
  - de la validation initiale
  - d'une validation après révision

Le problème actuel n'est pas le backend seul. Le vrai sujet est la cohérence de bout en bout :

- `wp-builder-v2`
- `wp-builder-v2-validation-loop`
- `wp-builder-v2-targeted-rebuild`
- le bridge
- le frontend

## Objectif Produit

L'utilisateur ne doit jamais se demander :

- "est-ce la première validation ou une nouvelle version ?"
- "qu'est-ce qui a changé ?"
- "quelle version est en train d'être relue ?"
- "est-ce que ma demande de changement a été appliquée ?"

Le système doit rendre cela explicite.

## Résultat Attendu

Pour une même `request`, on doit pouvoir voir :

- le cycle de validation courant
- l'artefact ciblé
- la version ciblée
- la dernière décision humaine
- le commentaire de validation
- les changements demandés
- les versions reconstruites
- le retour en `waiting_validation`

## Cycle Métier

### 1. Validation initiale

Le workflow `wp-builder-v2` :

- génère les artefacts du plan
- stocke les artefacts
- appelle `POST /requests/:id/validation-request`

Le bridge :

- met la demande en `status = waiting_validation`
- renseigne `request.validation.*`

Le frontend :

- affiche la demande dans `Validations`
- montre l'artefact ciblé et sa version

### 2. Décision humaine

Depuis le frontend, l'utilisateur choisit :

- `approved`
- `changes_requested`
- `rejected`

Le frontend envoie :

- `POST /requests/:id/validation-decisions`

Payload type :

```json
{
  "artifact_type": "site_architecture",
  "artifact_version": 2,
  "decision": "changes_requested",
  "comment": "Rendre la page services plus claire",
  "requested_changes": [
    "Ajouter une FAQ sur Contact",
    "Rendre le ton plus premium"
  ],
  "created_by": "user"
}
```

### 3. Branche `approved`

Le bridge ou `validation-loop` :

- stocke la décision
- passe `request.validation.status = approved`
- prépare ensuite l'enchaînement vers le workflow d'exécution WordPress

Note :

- aujourd'hui, la validation peut être enregistrée
- mais le déclenchement de `WordPress Execution` doit encore être branché explicitement

### 4. Branche `changes_requested`

Le bridge :

- stocke la décision
- garde la traçabilité de la version visée

Le workflow `wp-builder-v2-validation-loop` :

- reçoit la décision
- déclenche `wp-builder-v2-targeted-rebuild`

Le workflow `wp-builder-v2-targeted-rebuild` :

- crée une nouvelle version de l'artefact ciblé
- reconstruit les artefacts dépendants
- renvoie une nouvelle `validation-request`

Le bridge :

- remet la demande en `waiting_validation`

Le frontend :

- doit clairement montrer que cette validation n'est plus la validation initiale
- mais une validation après révision

### 5. Branche `rejected`

Le bridge :

- stocke la décision
- met `request.validation.status = rejected`

Le frontend :

- doit afficher que le pipeline est arrêté

## Contrat De Données Minimal

### Dans `Request.validation`

Le bloc `validation` doit être considéré comme l'état courant de la validation active.

Champs utiles :

```json
{
  "status": "waiting_validation",
  "resume_url": "http://localhost:5678/webhook/wp-builder-v2-validation-loop",
  "target_artifact": "site_architecture",
  "target_version": 3,
  "requested_at": "2026-03-19T10:00:00.000Z",
  "approved_at": null,
  "last_decision_at": "2026-03-19T10:12:00.000Z",
  "last_decision_by": "user",
  "revision_requested_at": "2026-03-19T10:12:00.000Z",
  "revision_reason": "Rendre le ton plus premium",
  "revision_requested_by": "user",
  "brief_architecte": {},
  "workflow_decision_in_progress": false
}
```

### Dans `ValidationDecision`

Chaque décision est un événement historisé.

Exemple :

```json
{
  "requestId": "req-123",
  "artifact_type": "site_architecture",
  "artifact_version": 2,
  "decision": "changes_requested",
  "comment": "Le ton est trop générique",
  "requested_changes": [
    "Rendre la page services plus premium",
    "Ajouter une FAQ sur Contact"
  ],
  "created_by": "user",
  "createdAt": "2026-03-19T10:12:00.000Z"
}
```

### Dans `RequestArtifact`

Chaque version doit rester visible.

Exemple :

```json
{
  "requestId": "req-123",
  "artifact_type": "site_architecture",
  "version": 3,
  "status": "generated",
  "payload": {},
  "source_artifacts": [
    {
      "artifact_type": "discovery_brief",
      "version": 3
    }
  ],
  "generator": {
    "workflow": "wp-builder-v2-targeted-rebuild",
    "stage": "site_architecture",
    "engine": "codex"
  }
}
```

## Règle D'Interprétation Frontend

Le frontend ne doit pas déduire la situation seulement à partir de `request.status`.

Il doit croiser :

- `request.status`
- `request.validation.status`
- `request.validation.target_artifact`
- `request.validation.target_version`
- la dernière `ValidationDecision`
- les artefacts disponibles par type/version

### Cas 1. Validation initiale

Conditions typiques :

- `request.status === 'waiting_validation'`
- aucune décision `changes_requested` plus récente que la demande courante

Affichage attendu :

- badge `Validation initiale`
- texte : `Vous validez la première version du plan`

### Cas 2. Validation après changements demandés

Conditions typiques :

- `request.status === 'waiting_validation'`
- il existe au moins une décision `changes_requested`
- `request.validation.target_version` est supérieure à la version visée par la dernière décision

Affichage attendu :

- badge `Nouvelle version après révision`
- texte : `Vous relisez la version reconstruite après demande de changements`

### Cas 3. Révision en cours

Conditions typiques :

- `request.validation.status === 'revising'`

Affichage attendu :

- badge `Révision en cours`
- texte : `Le pipeline reconstruit une nouvelle version`

### Cas 4. Rejet

Conditions typiques :

- `request.validation.status === 'rejected'`

Affichage attendu :

- badge `Validation rejetée`
- texte : `Le pipeline est arrêté`

## Ce Que Le Frontend Doit Afficher

Le frontend doit avoir trois niveaux de lecture.

### Niveau 1. Résumé de la validation courante

Dans `ValidationView.jsx`, afficher en haut :

- type de validation :
  - `Validation initiale`
  - `Validation après révision`
- artefact ciblé :
  - `site_architecture`
- version ciblée :
  - `v3`
- dernière décision :
  - `changes_requested`
- auteur de la dernière décision
- date de la dernière décision

Exemple de résumé :

```text
Validation après révision
Artefact en revue : site_architecture v3
Dernière décision : changements demandés le 19/03/2026 à 16:30 par user
```

### Niveau 2. Pourquoi cette validation existe

Si la validation actuelle est consécutive à des changements demandés, afficher :

- le commentaire précédent
- la liste des changements demandés

Exemple :

```text
Cette validation fait suite à une demande de changements :
- Ajouter une FAQ sur Contact
- Rendre le ton plus premium
```

### Niveau 3. Qu'est-ce qui a changé

Le frontend doit proposer :

- un accès rapide à `RevisionsView`
- une comparaison entre la version précédente et la version courante

Exemple :

- `Comparer v2 -> v3`

## Ce Que Le Frontend Doit Modifier

### `ValidationView.jsx`

But :

- ne plus montrer seulement un sélecteur d'artefact
- montrer le contexte de validation

À ajouter :

- un calcul de `validationMode`
- un encart `Validation initiale` ou `Validation après révision`
- un encart `Dernière demande de changement`
- un lien ou bouton `Voir les révisions`

Sources à utiliser :

- `GET /requests/:id/artifacts`
- `GET /requests/:id/validation-decisions`
- `request.validation`

### `RequestDetail.jsx`

But :

- montrer immédiatement si la demande affichée attend :
  - une validation initiale
  - une revalidation après rebuild

À ajouter :

- badge `Validation initiale`
- badge `Nouvelle version à relire`
- affichage de `target_artifact vX`

### `PipelineView.jsx`

But :

- afficher le cycle de validation en plus du simple statut

À ajouter :

- `Current validation cycle`
- `Current target`
- `Last decision`
- `Rebuild in progress`

### `RevisionsView.jsx`

But :

- devenir la vue de référence pour l'historique

À afficher plus clairement :

- timeline des décisions
- lien entre chaque décision et la version produite ensuite
- comparaison `ancienne version -> nouvelle version`

## Heuristique Frontend Recommandée

Le frontend peut calculer un état d'affichage simple :

```js
function getValidationDisplayState(request, decisions = []) {
  const validation = request.validation || {};
  const lastDecision = decisions[0] || null;

  if (validation.status === 'revising') {
    return 'revising';
  }

  if (validation.status === 'rejected') {
    return 'rejected';
  }

  if (request.status === 'waiting_validation') {
    if (lastDecision?.decision === 'changes_requested') {
      return 'post_revision_validation';
    }
    return 'initial_validation';
  }

  if (validation.status === 'approved') {
    return 'approved';
  }

  return 'default';
}
```

Cette heuristique est suffisante pour l'UI.

## Règle Métier Importante

Une `request` garde le même `requestId`.

Donc :

- on ne crée pas une nouvelle demande frontend pour chaque cycle
- on crée de nouvelles versions d'artefacts
- on crée de nouvelles décisions de validation
- on met à jour l'état courant de `request.validation`

C'est pour cela que, sans historique visible, l'utilisateur a l'impression de revoir "la même demande".

## Séquence Complète Cible

### Cas `changes_requested`

1. `wp-builder-v2` envoie `validation-request`
2. bridge passe la demande en `waiting_validation`
3. frontend affiche `Validation initiale`
4. utilisateur choisit `changes_requested`
5. frontend envoie `POST /validation-decisions`
6. bridge stocke / transmet à `validation-loop`
7. `validation-loop` déclenche `targeted-rebuild`
8. `targeted-rebuild` génère de nouvelles versions
9. `targeted-rebuild` renvoie une nouvelle `validation-request`
10. bridge remet la demande en `waiting_validation`
11. frontend affiche `Validation après révision`
12. frontend montre :
    - le commentaire précédent
    - la liste des changements demandés
    - la nouvelle version ciblée

## Implémentation Backend Recommandée

### Ce qui existe déjà

- `POST /requests/:id/validation-request`
- `POST /requests/:id/validation-decisions`
- `GET /requests/:id/validation-decisions`
- `GET /requests/:id/artifacts`
- `GET /requests/:id/artifacts/:type/versions`

### Ce qu'il faut garantir

Le bridge doit toujours mettre à jour :

- `request.status`
- `request.validation.status`
- `request.validation.target_artifact`
- `request.validation.target_version`
- `request.validation.last_decision_at`
- `request.validation.last_decision_by`
- `request.validation.revision_reason`
- `request.validation.revision_requested_at`

### Amélioration utile

Ajouter un endpoint résumé :

`GET /requests/:id/validation-context`

Réponse type :

```json
{
  "ok": true,
  "request_id": "req-123",
  "display_state": "post_revision_validation",
  "current_target": {
    "artifact_type": "site_architecture",
    "version": 3
  },
  "last_decision": {
    "decision": "changes_requested",
    "comment": "Le ton est trop générique",
    "requested_changes": [
      "Rendre la page services plus premium"
    ],
    "created_by": "user",
    "created_at": "2026-03-19T10:12:00.000Z"
  },
  "previous_target": {
    "artifact_type": "site_architecture",
    "version": 2
  }
}
```

Ce n'est pas obligatoire, mais ça simplifie beaucoup le frontend.

## Implémentation n8n Recommandée

### Dans `wp-builder-v2`

À la fin :

- envoyer `validation-request`

### Dans `wp-builder-v2-validation-loop`

Rôle :

- router la décision

Branche `approved` :

- stocker si nécessaire
- puis déclencher plus tard `WordPress Execution`

Branche `changes_requested` :

- déclencher `wp-builder-v2-targeted-rebuild`

Branche `rejected` :

- arrêter le flux

### Dans `wp-builder-v2-targeted-rebuild`

Rôle :

- régénérer
- restocker
- redemander une validation

Important :

- le workflow doit impérativement mettre à jour les versions d'artefacts
- sinon le frontend ne peut pas distinguer l'avant et l'après

## Plan D'Implémentation Concret

### Phase 1. Lisibilité immédiate

Objectif :

- rendre l'UI compréhensible sans changer tout le backend

À faire :

- charger `validation-decisions` dans `ValidationView.jsx`
- afficher la dernière décision
- afficher `target_artifact` et `target_version`
- afficher un badge `Validation initiale` / `Validation après révision`

### Phase 2. Historique propre

À faire :

- renforcer `RevisionsView.jsx`
- relier chaque décision à la version suivante
- proposer `Comparer version précédente / version courante`

### Phase 3. API de confort

À faire :

- ajouter `GET /requests/:id/validation-context`

### Phase 4. Exécution WordPress

À faire :

- brancher la branche `approved` vers le workflow d'exécution

## Critères D'Acceptation

La logique sera considérée comme correctement implémentée si :

- l'utilisateur voit immédiatement si la validation affichée est initiale ou post-révision
- la version ciblée est visible
- la dernière demande de changement est visible
- après un `changes_requested`, une nouvelle version est visible dans l'UI
- `RevisionsView` permet de comprendre ce qui a changé
- après un `approved`, l'UI ne laisse pas croire qu'il s'agit encore de la même étape

## Résumé Simple

Le point clé est celui-ci :

- une `request` reste la même
- ce sont les `artefacts` et les `validation-decisions` qui changent

Donc le frontend doit afficher :

- le cycle courant
- la version courante
- la dernière décision
- et l'historique des révisions

Sans ça, l'utilisateur a toujours l'impression de revoir "la même demande", même quand une nouvelle version a bien été reconstruite.
