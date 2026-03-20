# Codex/Claude Bridge

Service HTTP local qui encapsule les CLIs `codex` et `claude` pour permettre à n8n (ou tout autre outil) de les appeler via des requêtes HTTP standardisées.

## Architecture

```
┌─────────────┐     HTTP      ┌─────────────────┐     spawn     ┌─────────────┐
│    n8n      │ ────────────► │  Bridge Server  │ ────────────► │  codex/     │
│  (Docker)   │    :3000      │   (Fastify)     │               │  claude CLI │
└─────────────┘               └─────────────────┘               └─────────────┘
```

## Installation

```bash
cd /home/cundo/Bureau/code_perso/MCP/bridge
npm install
```

## Configuration

Variables d'environnement (ou fichier `.env`) :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `BRIDGE_HOST` | Adresse d'écoute | `0.0.0.0` |
| `BRIDGE_PORT` | Port d'écoute | `3000` |
| `BRIDGE_AUTH_ENABLED` | Activer l'authentification | `false` |
| `BRIDGE_TOKEN` | Token d'authentification | `dev-token-change-me` |
| `CODEX_CMD` | Commande codex | `codex` |
| `CLAUDE_CMD` | Commande claude | `claude` |
| `MAX_CONCURRENT_JOBS` | Jobs simultanés max | `2` |
| `MAX_INPUT_SIZE` | Taille max entrée (chars) | `100000` |
| `MAX_OUTPUT_SIZE` | Taille max sortie (chars) | `500000` |

## Démarrage

```bash
# Production
npm start

# Développement (avec auto-reload)
npm run dev
```

Sortie attendue :
```
╔════════════════════════════════════════════════╗
║        Codex/Claude Bridge Server              ║
╠════════════════════════════════════════════════╣
║  Listening: http://0.0.0.0:3000                ║
║  Auth:      disabled                           ║
║  Max jobs:  2                                  ║
╚════════════════════════════════════════════════╝
```

## API Endpoints

### GET /health

Vérifie l'état du service.

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2024-03-18T10:30:00.000Z",
  "version": "1.0.0"
}
```

### POST /task

Exécute une tâche via Codex ou Claude CLI.

**Headers :**
```
Content-Type: application/json
X-Bridge-Token: <token>  # Si auth activée
```

**Body :**
```json
{
  "engine": "codex",
  "prompt": "Génère un script bash qui installe WordPress",
  "cwd": "/path/to/workspace",
  "timeout_ms": 120000,
  "expect_json": false,
  "context": {
    "task_id": "wp-001",
    "stage": "build"
  }
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `engine` | `"codex"` \| `"claude"` | Oui | Moteur à utiliser |
| `prompt` | string | Oui | Prompt à envoyer au CLI |
| `cwd` | string | Non | Répertoire de travail |
| `timeout_ms` | number | Non | Timeout en ms (défaut: 120000, max: 600000) |
| `expect_json` | boolean | Non | Parser la sortie en JSON |
| `context` | object | Non | Métadonnées (retournées telles quelles) |

**Réponse succès (200) :**
```json
{
  "ok": true,
  "engine": "codex",
  "exit_code": 0,
  "duration_ms": 3500,
  "stdout": "#!/bin/bash\n...",
  "stderr": "",
  "parsed_json": null,
  "meta": {
    "task_id": "wp-001",
    "stage": "build"
  }
}
```

**Réponse erreur (422) :**
```json
{
  "ok": false,
  "engine": "codex",
  "exit_code": 1,
  "duration_ms": 1200,
  "stdout": "",
  "stderr": "Error: ...",
  "error_type": "execution_error",
  "meta": {}
}
```

### POST /codex

Raccourci pour `/task` avec `engine: "codex"`.

### POST /claude

Raccourci pour `/task` avec `engine: "claude"`.

## Types d'erreurs

| error_type | Description |
|------------|-------------|
| `invalid_engine` | Engine non reconnu |
| `execution_error` | CLI a retourné un code != 0 |
| `timeout` | Dépassement du timeout |
| `parse_error` | JSON attendu mais invalide |
| `spawn_error` | Erreur au lancement du processus |
| `internal_error` | Erreur serveur |

## Exemples d'utilisation

### curl

```bash
# Health check
curl http://localhost:3000/health

# Tâche Codex simple
curl -X POST http://localhost:3000/codex \
  -H "Content-Type: application/json" \
  -d '{"prompt": "echo hello world"}'

# Tâche Claude avec JSON
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "claude",
    "prompt": "Retourne un JSON avec les champs name et version",
    "expect_json": true,
    "timeout_ms": 60000
  }'
```

### n8n (HTTP Request Node)

**Configuration :**
- Method: `POST`
- URL: `http://192.168.1.147:3000/task` (IP de l'hôte si n8n est dans Docker)
- Body Content Type: `JSON`
- Body:
```json
{
  "engine": "codex",
  "prompt": "{{ $json.prompt }}",
  "timeout_ms": 120000,
  "expect_json": true
}
```

**Note importante pour n8n :** Si le prompt contient du JSON imbriqué, utiliser `JSON.stringify()` :
```
{{ JSON.stringify($json.body) }}
```

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    engine: 'codex',
    prompt: 'Liste les fichiers du répertoire courant',
    cwd: '/home/user/project'
  })
});

const result = await response.json();
if (result.ok) {
  console.log(result.stdout);
} else {
  console.error(result.error_type, result.stderr);
}
```

## Structure du projet

```
bridge/
├── src/
│   ├── server.js           # Point d'entrée Fastify
│   ├── routes/
│   │   ├── health.js       # GET /health
│   │   └── task.js         # POST /task, /codex, /claude
│   ├── services/
│   │   └── executor.js     # Spawn CLI + timeout + parsing
│   ├── queue/
│   │   └── job-queue.js    # File d'attente avec limite
│   └── utils/
│       └── response.js     # Format standardisé
├── config/
│   └── default.js          # Configuration
├── package.json
└── README.md
```

## Commandes CLI utilisées

Le bridge exécute les CLIs avec ces arguments :

**Codex :**
```bash
codex exec --skip-git-repo-check "<prompt>"
```

**Claude :**
```bash
claude -p "<prompt>"
```

## Sécurité

- **Bind local** : Par défaut `0.0.0.0` pour accès Docker, changer à `127.0.0.1` si local uniquement
- **Pas d'interpolation shell** : Utilise `spawn` sans shell
- **Timeout obligatoire** : Maximum 10 minutes
- **Limite de concurrence** : 2 jobs simultanés par défaut
- **Authentification optionnelle** : Header `X-Bridge-Token`

## Dépannage

### Port déjà utilisé
```bash
# Trouver et tuer le processus
fuser -k 3000/tcp
```

### n8n ne peut pas atteindre le bridge
- Vérifier que le bridge écoute sur `0.0.0.0` (pas `127.0.0.1`)
- Utiliser l'IP de l'hôte (ex: `192.168.1.147`) au lieu de `localhost`

### Erreur d'authentification
```bash
# Désactiver l'auth
export BRIDGE_AUTH_ENABLED=false
npm start
```

### Timeout trop court
```bash
# Augmenter le timeout par défaut
# Dans le body de la requête :
{ "timeout_ms": 300000 }  # 5 minutes
```

## Intégration avec n8n Workflow

Exemple de workflow n8n utilisant le bridge :

```
[Trigger] → [HTTP Request: Builder] → [Code: Save Script] → [Notification]
```

Le nœud "Code: Save Script" peut sauvegarder le script généré :

```javascript
const fs = require('fs');

const inputData = $input.first().json;
const bashScript = inputData.parsed_json?.bash_script || inputData.stdout;

if (!bashScript) {
  throw new Error('No bash_script found in input');
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `wp-build-${timestamp}.sh`;
const filePath = `/tmp/${filename}`;

fs.writeFileSync(filePath, bashScript, { mode: 0o755 });

return [{
  json: {
    success: true,
    filePath: filePath,
    filename: filename,
    scriptLength: bashScript.length
  }
}];
```

## Licence

MIT
