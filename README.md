# MCP_N8N

Serveur MCP local pour exposer `n8n` comme un ensemble d'outils utilisables
depuis `Codex`, `Claude Code` ou tout autre client compatible `MCP`.

## Idee du projet

Ce projet fait le pont entre:

- le protocole `MCP`
- l'API REST de `n8n`

Concretement:

- le serveur lit les workflows actifs dans `n8n`
- chaque workflow actif devient un outil MCP
- des outils utilitaires permettent aussi d'administrer `n8n`

Exemple:

- workflow n8n: `WP Site Builder - Multi Agent`
- outil MCP expose: `wp_site_builder_multi_agent`

---

## Architecture

```text
Client MCP
(Codex / Claude Code)
        |
        | stdio
        v
MCP_N8N/src/index.ts
        |
        +--> MCP_N8N/src/tools.ts
        |
        +--> MCP_N8N/src/n8n-client.ts
                     |
                     | HTTP REST
                     v
                    n8n
```

Logique:

- `src/index.ts` gere le serveur MCP et route les requetes
- `src/tools.ts` transforme les workflows n8n en outils MCP
- `src/n8n-client.ts` centralise tous les appels HTTP vers `n8n`

---

## Structure des fichiers

### `src/index.ts`

Point d'entree du serveur MCP.

Responsabilites:

- demarrer le serveur
- exposer `tools/list`
- exposer `tools/call`
- distinguer outils utilitaires et workflows dynamiques

### `src/n8n-client.ts`

Couche d'acces a l'API REST `n8n`.

Responsabilites:

- lister les workflows
- lire un workflow
- creer / modifier / supprimer
- activer / desactiver
- lancer un workflow
- lire une execution

### `src/tools.ts`

Couche de transformation `n8n -> MCP`.

Responsabilites:

- normaliser les noms d'outils
- construire les descriptions
- declarer les schemas des outils exposes

### `scripts/smoke-test.js`

Script de verification minimale.

Il lance le serveur compile comme un client MCP le ferait, puis teste
`listTools`.

### `docs/architecture.md`

Documentation d'architecture plus detaillee.

### `docs/n8n-local-codex-claude-bridge.md`

Documentation sur le cas ou `n8n` doit faire appel a `Codex` ou `Claude Code`
en local via un bridge.

---

## Types d'outils exposes

Le serveur expose deux familles d'outils.

### 1. Outils utilitaires

Toujours presents:

- `n8n_list_workflows`
- `n8n_list_all_workflows`
- `n8n_get_workflow`
- `n8n_create_workflow`
- `n8n_update_workflow`
- `n8n_delete_workflow`
- `n8n_set_workflow_active`
- `n8n_get_execution_status`

Ils servent a administrer `n8n` depuis MCP.

### 2. Outils dynamiques

Chaque workflow actif dans `n8n` devient un outil MCP.

Ces outils ont tous ce schema d'entree general:

```json
{
  "input_data": {},
  "wait_for_result": true
}
```

Notes:

- `input_data` est volontairement libre
- le serveur MCP ne connait pas le schema fin de chaque workflow
- la validation metier doit donc se faire dans le workflow `n8n`

---

## Cycle de fonctionnement

### `tools/list`

Quand un client MCP demande la liste des outils:

1. `src/index.ts` lit les workflows actifs
2. `src/tools.ts` les transforme en outils MCP
3. le serveur retourne la liste complete

### `tools/call`

Quand un client appelle un outil:

- si c'est un outil utilitaire, `index.ts` appelle directement
  `n8n-client.ts`
- sinon, `index.ts` cherche un workflow actif correspondant au nom de
  l'outil et le lance

---

## Execution d'un workflow

La logique d'execution se trouve dans `src/n8n-client.ts`.

Strategie:

1. lire le workflow complet
2. detecter s'il contient un noeud `webhook`
3. si oui, appeler l'URL webhook
4. sinon, utiliser l'API REST `/api/v1/workflows/:id/run`

Pourquoi:

- certains workflows sont pensés pour etre entres par webhook
- d'autres se lancent plus naturellement via l'API de run

---

## Cache

Le serveur garde en memoire la liste des workflows actifs pendant `30`
secondes.

But:

- eviter trop d'appels REST a `n8n`
- rendre `tools/list` plus reactif

Le cache est invalide quand on:

- cree un workflow
- modifie un workflow
- supprime un workflow
- change son etat actif/inactif

---

## Configuration

Le projet utilise un fichier `.env`.

Variables principales:

```env
N8N_URL=http://localhost:5678
N8N_API_KEY=ton-api-key
N8N_TIMEOUT_MS=5000
```

`N8N_URL`

- URL de base de l'instance n8n

`N8N_API_KEY`

- cle API utilisee pour l'authentification REST

`N8N_TIMEOUT_MS`

- timeout HTTP applique aux appels vers `n8n`

---

## Commandes utiles

Installation deja supposee via `npm install`.

### Build

```bash
npm run build
```

Compile TypeScript vers `dist/`.

### Dev

```bash
npm run dev
```

Lance le serveur depuis les sources via `ts-node`.

### Start

```bash
npm run start
```

Lance la version compilee.

### Smoke test

```bash
npm run smoke:test
```

Verifie:

- que le serveur demarre
- que la connexion MCP fonctionne
- que `listTools` repond

---

## Lecture recommandee

Pour comprendre rapidement le projet:

1. lire `README.md`
2. lire `src/index.ts`
3. lire `src/tools.ts`
4. lire `src/n8n-client.ts`
5. lire `docs/architecture.md`

Pour le besoin `n8n -> Codex local / Claude Code local`:

6. lire `docs/n8n-local-codex-claude-bridge.md`

---

## Limites actuelles

### Schema des workflows

Le projet ne deduit pas automatiquement le schema exact d'entree de chaque
workflow `n8n`.

Donc:

- les outils dynamiques exposent un schema generique
- la validation detaillee reste a faire dans `n8n`

### Resultat des webhooks

Le comportement des workflows lances par webhook depend du workflow et de la
reponse renvoyee par `n8n`.

### Runtime IA local

Ce projet expose `n8n` via MCP.
Il ne transforme pas, a lui seul, `Codex` ou `Claude Code` en backend IA
local pour les noeuds `AI Agent` de `n8n`.

Pour cela, il faut un bridge local dedie.

---

## Evolution logique du projet

Les prochaines evolutions raisonnables seraient:

- typer plus finement certains payloads
- ajouter davantage de tests automatiques
- ajouter un bridge local pour `Codex` / `Claude Code`
- enrichir les outils d'observabilite autour des executions n8n

---

## Documents associes

- [Architecture](./docs/architecture.md)
- [n8n avec Codex local et Claude Code local](./docs/n8n-local-codex-claude-bridge.md)
