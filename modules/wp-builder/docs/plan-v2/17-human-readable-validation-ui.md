# UI De Validation Lisible Pour Humains

Cette doc décrit comment remplacer l'affichage JSON brut des artefacts par une interface de validation lisible.

Le problème actuel est simple :

- le frontend affiche surtout `JSON.stringify(payload, null, 2)`
- techniquement c'est correct
- humainement ce n'est pas exploitable

Un validateur humain doit pouvoir répondre rapidement à ces questions :

- qu'est-ce que l'IA propose ?
- qu'est-ce qu'on va construire ?
- qu'est-ce qui a changé depuis la version précédente ?
- qu'est-ce qu'il faut approuver ou corriger ?

Le JSON brut doit rester disponible, mais ne doit plus être la vue par défaut.

## Objectif

Transformer la validation V2 en lecture métier.

Le frontend doit afficher :

- une vue résumée lisible
- une vue détaillée structurée
- une comparaison entre versions
- un accès optionnel au JSON brut

## Principe Général

Pour chaque `artifact_type`, il faut un rendu dédié.

Donc :

- `site_architecture` ne doit pas être affiché comme `execution_plan`
- `discovery_brief` ne doit pas être affiché comme `wordpress_plan`

Le frontend doit avoir :

- un composant routeur
- un composant par type d'artefact
- un fallback générique si le type n'est pas encore géré

## Expérience Utilisateur Cible

Dans `ValidationView`, l'utilisateur doit voir dans cet ordre :

1. le contexte
- validation initiale ou post-révision
- artefact ciblé
- version
- dernière décision

2. un résumé lisible
- ce que contient l'artefact

3. une zone de lecture détaillée
- sections métier

4. éventuellement une vue `JSON brut`

5. les actions
- approuver
- demander des changements
- rejeter

## Structure UI Recommandée

### Bloc 1. En-tête de validation

Afficher :

- nom du projet
- type de validation
- artefact sélectionné
- version
- dernière décision

Exemple :

```text
Validation après révision
Artefact en revue : site_architecture v3
Dernière décision : changements demandés
```

### Bloc 2. Résumé métier

Afficher 5 à 10 lignes maximum, lisibles en 10 secondes.

Exemple pour `site_architecture` :

```text
4 pages prévues
Direction design : moderne, chaleureux, clair
Pages clés : Accueil, Services, Contact
Notes techniques : formulaire de contact, SEO, responsive
```

### Bloc 3. Vue détaillée lisible

Afficher les données structurées en cartes, tableaux, listes ou sections.

### Bloc 4. Vue brute

Afficher un accordéon ou onglet :

- `Voir le JSON brut`

Le JSON brut est utile pour :

- debug
- validation technique
- support développeur

Mais ce n'est pas la vue par défaut.

## Composant Routeur

Créer un composant du type :

- `ArtifactHumanView.jsx`

Rôle :

- reçoit `artifact`
- route selon `artifact.artifact_type`

Exemple :

```jsx
function ArtifactHumanView({ artifact }) {
  switch (artifact?.artifact_type) {
    case 'discovery_brief':
      return <DiscoveryBriefView artifact={artifact} />;
    case 'site_architecture':
      return <SiteArchitectureView artifact={artifact} />;
    case 'content_plan':
      return <ContentPlanView artifact={artifact} />;
    case 'design_plan':
      return <DesignPlanView artifact={artifact} />;
    case 'wordpress_plan':
      return <WordPressPlanView artifact={artifact} />;
    case 'execution_plan':
      return <ExecutionPlanView artifact={artifact} />;
    default:
      return <GenericArtifactJsonView artifact={artifact} />;
  }
}
```

## Composants À Créer

Créer un dossier :

- `bridge/frontend/src/components/artifacts/`

Composants recommandés :

- `ArtifactHumanView.jsx`
- `ArtifactSummaryCard.jsx`
- `GenericArtifactJsonView.jsx`
- `DiscoveryBriefView.jsx`
- `SiteArchitectureView.jsx`
- `ContentPlanView.jsx`
- `DesignPlanView.jsx`
- `WordPressPlanView.jsx`
- `ExecutionPlanView.jsx`

## Rendu Par Type D'Artefact

### 1. `discovery_brief`

Ce que l'humain doit comprendre :

- les objectifs
- les contraintes
- ce qui manque
- les risques

Affichage recommandé :

- carte `Objectifs`
- carte `Contraintes`
- carte `Informations manquantes`
- carte `Risques`

#### Résumé

Exemple :

```text
3 objectifs principaux
4 informations manquantes
2 risques identifiés
```

#### Détail

Objectifs :

- description
- priorité

Contraintes :

- techniques
- business
- timeline

Informations manquantes :

- liste simple

Risques :

- description
- gravité
- mitigation

### 2. `site_architecture`

C'est l'artefact le plus important à rendre lisible.

Ce que l'humain doit comprendre :

- quelles pages existent
- à quoi elles servent
- quelles sections seront visibles
- quelle direction design globale est proposée

Affichage recommandé :

- résumé global
- liste des pages
- détail page par page
- bloc direction design
- bloc notes techniques

#### Résumé

Afficher :

- nom du site
- type de site
- nombre de pages
- ton
- layout

#### Détail par page

Pour chaque page :

- `title`
- `slug`
- `goal`
- nombre de sections
- liste des sections

Pour chaque section :

- `type`
- `title`
- `content_brief`

#### Présentation suggérée

Carte page :

```text
Accueil
Slug : accueil
Objectif : présenter l'offre

Sections :
- Hero : introduction de l'offre
- Bénéfices : rassurer
- CTA : prise de contact
```

### 3. `content_plan`

Ce que l'humain doit comprendre :

- quel contenu sera rédigé
- comment les pages sont structurées
- quels éléments SEO sont prévus

Affichage recommandé :

- une carte par page
- SEO title
- meta description
- sections / content blocks

#### Résumé

Afficher :

- nombre de pages avec contenu
- nombre total de sections

#### Détail

Pour chaque page :

- `slug`
- `seo_title`
- `meta_description`
- sections de contenu

### 4. `design_plan`

Ce que l'humain doit comprendre :

- l'intention visuelle
- les composants clés
- les règles visuelles globales

Affichage recommandé :

- ton global
- palette
- typographie
- composants
- règles de layout

Même si le schéma est plus technique, la lecture doit rester visuelle.

Exemples d'affichage :

- palette sous forme de badges couleur
- composants sous forme de cartes
- typographie sous forme de puces

### 5. `wordpress_plan`

Ce que l'humain doit comprendre :

- ce qui sera créé dans WordPress
- quelles pages
- quels menus
- quels plugins
- quels formulaires

Affichage recommandé :

- tableau `Pages à créer`
- liste `Menus`
- liste `Plugins`
- liste `Forms`
- bloc `SEO actions`

#### Résumé

Afficher :

- nombre de pages à créer
- nombre de menus
- nombre de plugins

### 6. `execution_plan`

Ce que l'humain doit comprendre :

- quelles sont les étapes d'exécution
- dans quel ordre
- quelles dépendances sont attendues

Affichage recommandé :

- timeline ou liste ordonnée des steps
- dépendances
- sorties attendues

#### Résumé

Afficher :

- mode : `dry_run` ou autre
- nombre d'étapes
- nombre de sorties attendues

#### Détail

Pour chaque step :

- `step_key`
- `order`
- `description`

## Fallback Générique

Tous les artefacts ne seront pas forcément pris en charge immédiatement.

Il faut donc un fallback :

- `GenericArtifactJsonView`

Rôle :

- afficher un petit résumé automatique
- puis le JSON brut

Exemple :

```text
Type non encore supporté par une vue métier dédiée.
Affichage JSON brut ci-dessous.
```

## Où Modifier Le Frontend

### `ValidationView.jsx`

Aujourd'hui :

- aperçu = `pre > code > JSON.stringify(...)`

À faire :

- remplacer ce bloc par `ArtifactHumanView`
- ajouter un toggle `Vue lisible / JSON brut`

Exemple logique :

```jsx
{selectedArtifact && (
  <ArtifactHumanView artifact={selectedArtifact} />
)}
```

### `RevisionsView.jsx`

À faire :

- utiliser le même système de rendu lisible
- afficher les deux versions comparées
- garder la comparaison JSON comme outil secondaire

### `RequestDetail.jsx`

À faire :

- afficher un mini résumé lisible du `target_artifact`
- pas le JSON complet

## Vue Comparaison Recommandée

Pour une comparaison entre deux versions, ne pas comparer seulement le JSON ligne à ligne.

Il faut proposer deux niveaux :

### Niveau 1. Résumé de changements

Exemple pour `site_architecture` :

- page `FAQ` ajoutée
- section `CTA` modifiée sur `Accueil`
- direction design mise à jour

### Niveau 2. Détail

Deux colonnes :

- `Version précédente`
- `Version actuelle`

Puis JSON brut en option.

## Heuristiques De Résumé Automatique

Chaque vue doit proposer une fonction `getSummary`.

Exemple :

### `site_architecture`

```js
function getSiteArchitectureSummary(payload) {
  return {
    pagesCount: payload.pages?.length || 0,
    sectionCount: (payload.pages || []).reduce(
      (sum, page) => sum + (page.sections?.length || 0),
      0
    ),
    tone: payload.design_direction?.tone || '-',
    layout: payload.design_direction?.layout || '-',
  };
}
```

### `discovery_brief`

```js
function getDiscoverySummary(payload) {
  return {
    objectivesCount: payload.objectives?.length || 0,
    missingInfoCount: payload.missing_information?.length || 0,
    risksCount: payload.risk_flags?.length || 0,
  };
}
```

## Ordre D'Implémentation Recommandé

### Phase 1. Remplacer le JSON brut principal

Créer :

- `ArtifactHumanView.jsx`
- `GenericArtifactJsonView.jsx`
- `SiteArchitectureView.jsx`
- `DiscoveryBriefView.jsx`
- `WordPressPlanView.jsx`

Puis brancher `ValidationView.jsx`.

Pourquoi cet ordre :

- `site_architecture` est le plus important à valider humainement
- `discovery_brief` aide à comprendre le contexte
- `wordpress_plan` aide à comprendre l'impact WordPress

### Phase 2. Étendre aux autres artefacts

Créer :

- `ContentPlanView.jsx`
- `DesignPlanView.jsx`
- `ExecutionPlanView.jsx`

### Phase 3. Améliorer `RevisionsView`

Ajouter :

- résumé de changements
- comparaison lisible
- JSON brut en second plan

## Exemple De Design Simple

Pour chaque vue :

- titre
- résumé en badges
- cartes métier
- JSON brut replié

Exemple de structure :

```jsx
<div className="space-y-4">
  <ArtifactSummaryCard ... />

  <section className="rounded-lg border p-4">
    <h4>Pages</h4>
    ...
  </section>

  <section className="rounded-lg border p-4">
    <h4>Direction design</h4>
    ...
  </section>

  <details>
    <summary>Voir le JSON brut</summary>
    <pre>...</pre>
  </details>
</div>
```

## Critères D'Acceptation

Cette amélioration sera considérée comme correcte si :

- un humain peut lire `site_architecture` sans regarder le JSON
- un humain peut lire `discovery_brief` sans regarder le JSON
- un humain peut lire `wordpress_plan` sans regarder le JSON
- le JSON brut reste accessible
- `ValidationView` n'affiche plus le JSON brut comme vue principale
- `RevisionsView` peut comparer deux versions de manière lisible

## Résumé Simple

Le bon modèle est :

- le JSON reste la vérité technique
- le frontend affiche une traduction métier lisible

Donc :

- vue lisible par défaut
- JSON brut en option
- un composant dédié par type d'artefact

Sans cela, la validation humaine reste trop difficile, même si le pipeline technique fonctionne correctement.
