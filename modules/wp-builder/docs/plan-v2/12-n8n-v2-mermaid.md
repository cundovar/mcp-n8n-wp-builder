# n8n V2 Mermaid

## But

Donner une vue simple de l'organisation V2 avec :

- `WP Builder V2 — Plan Generation`
- `WP Builder V2 — WordPress Execution`
- le rôle du `bridge`
- l'emplacement des agents IA

## Vue simple

```mermaid
flowchart TD
    A[Frontend] --> B[Bridge API]
    B --> C[(MongoDB)]

    B --> D[WP Builder V2 - Plan Generation]
    D --> D1[Agent IA - normalized_brief]
    D1 --> D2[Store Artifact]
    D2 --> D3[Agent IA - discovery_brief]
    D3 --> D4[Store Artifact]
    D4 --> D5[Agent IA - site_architecture]
    D5 --> D6[Store Artifact]
    D6 --> D7{Validation humaine}

    D7 -->|approve| E[WP Builder V2 - WordPress Execution]
    D7 -->|changes_requested| D8[Targeted rebuild dans Plan Generation]
    D8 --> D5
    D7 -->|reject| Z[Pipeline stopped]

    E --> E1[Load execution_plan]
    E1 --> E2[Prepare environment]
    E2 --> E3[Apply WordPress plan]
    E3 --> E4[Verify result]
    E4 --> E5[Store execution_report]

    D --> B
    E --> B
    B --> C
```

## Lecture simple

- `Plan Generation` contient les agents IA.
- Les agents IA appellent le bridge via `/task`.
- Chaque sortie utile est stockée comme artefact côté bridge.
- Après `site_architecture`, on passe en validation humaine.
- Si l'humain demande des changements, on régénère seulement la partie utile dans `Plan Generation`.
- Si l'humain approuve, on lance `WordPress Execution`.
- `WordPress Execution` n'est pas un workflow de réflexion IA principal. Il applique le plan validé.

## Où sont les agents IA ?

Les agents IA doivent être dans `WP Builder V2 - Plan Generation`.

Exemples de nœuds :

- `HTTP Request -> /task -> engine=codex -> normalized_brief`
- `HTTP Request -> /task -> engine=codex -> discovery_brief`
- `HTTP Request -> /task -> engine=codex -> site_architecture`
- `HTTP Request -> /task -> engine=codex -> content_plan`
- `HTTP Request -> /task -> engine=codex -> design_plan`
- `HTTP Request -> /task -> engine=codex -> wordpress_plan`
- `HTTP Request -> /task -> engine=codex -> execution_plan`

## Répartition recommandée

### Workflow 1 : `WP Builder V2 - Plan Generation`

Contient :

- webhook d'entrée
- lecture de la demande
- appels IA
- stockage des artefacts
- validation humaine
- régénération ciblée si nécessaire

### Workflow 2 : `WP Builder V2 - WordPress Execution`

Contient :

- lecture du plan validé
- exécution technique WordPress
- vérifications
- rapport final d'exécution

Ne contient pas en priorité :

- logique principale de génération métier
- boucle de validation humaine

## Version encore plus simple

```mermaid
flowchart LR
    A[Plan Generation] --> B{Validation}
    B -->|approve| C[WordPress Execution]
    B -->|changes_requested| A
    B -->|reject| D[Stop]
```
