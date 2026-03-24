# Scripts De Démarrage Dev

Le projet dispose maintenant de scripts simples pour lancer et arrêter l'environnement local sans tout ouvrir manuellement.

## Scripts

Dans [scripts](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/scripts) :

- [start-dev.sh](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/scripts/start-dev.sh)
- [stop-dev.sh](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/scripts/stop-dev.sh)
- [status-dev.sh](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/scripts/status-dev.sh)

## Ce qu'ils font

`start-dev.sh` :

- démarre MongoDB si `127.0.0.1:27017` n'est pas déjà accessible
- lance le bridge
- lance le frontend
- écrit des PID files dans `.run/`
- écrit les logs dans `.run/logs/`

`stop-dev.sh` :

- arrête le frontend
- arrête le bridge
- peut arrêter Mongo si tu lui passes `--with-mongo`

`status-dev.sh` :

- affiche si `bridge` et `frontend` tournent
- montre le chemin des logs
- vérifie si Mongo écoute sur `127.0.0.1:27017`

## Commandes

Depuis la racine du projet :

```bash
./scripts/start-dev.sh
```

```bash
./scripts/status-dev.sh
```

```bash
./scripts/stop-dev.sh
```

Pour arrêter aussi le conteneur Mongo démarré par le script :

```bash
./scripts/stop-dev.sh --with-mongo
```

## URLs utiles

- bridge : `http://localhost:3000`
- frontend : `http://localhost:5173`
- n8n : `http://localhost:5678`
- MongoDB : `mongodb://localhost:27017/wp-builder`

## Logs

Les logs sont dans :

- [`.run/logs/bridge.log`](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/.run/logs/bridge.log)
- [`.run/logs/frontend.log`](/home/cundo/Bureau/code_perso/MCP/MCP_N8N/.run/logs/frontend.log)

## Comment Mongo est démarré

Le script essaie dans cet ordre :

1. vérifier si Mongo répond déjà sur `127.0.0.1:27017`
2. sinon démarrer le conteneur Docker `mongodb`
3. sinon démarrer le conteneur Docker `bridge-mongo`

Si aucun de ces deux conteneurs n'existe, le script s'arrête avec une erreur.

## Limite

Ces scripts ne démarrent pas n8n.

Si tu veux, on peut ensuite étendre ça avec :

- un check n8n
- ou un démarrage Docker si ton stack le permet
