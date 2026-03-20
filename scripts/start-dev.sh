#!/usr/bin/env bash
set -euo pipefail

# Racine du projet et dossiers runtime locaux pour PID/logs.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
MONGO_MARKER="$RUN_DIR/mongo.container"

mkdir -p "$LOG_DIR"

# Test simple TCP pour savoir si un service écoute déjà.
is_port_open() {
  local host="$1"
  local port="$2"
  timeout 1 bash -c ":</dev/tcp/${host}/${port}" >/dev/null 2>&1
}

# Mongo n'est pas lancé par le projet lui-même.
# On essaye donc d'utiliser un conteneur Docker existant si le port 27017 n'est pas déjà ouvert.
start_mongo() {
  if is_port_open "127.0.0.1" "27017"; then
    echo "mongo already reachable on 127.0.0.1:27017"
    return 0
  fi

  local container=""
  if docker ps -a --format '{{.Names}}' | grep -qx "mongodb"; then
    container="mongodb"
  elif docker ps -a --format '{{.Names}}' | grep -qx "bridge-mongo"; then
    container="bridge-mongo"
  fi

  if [[ -z "$container" ]]; then
    echo "mongo not reachable and no known Docker container found (expected: mongodb or bridge-mongo)"
    return 1
  fi

  # On garde une trace du conteneur démarré pour pouvoir l'arrêter explicitement plus tard.
  docker start "$container" >/dev/null
  echo "$container" >"$MONGO_MARKER"
  echo "started mongo container: $container"

  # Attendre que Mongo accepte réellement les connexions avant de lancer le bridge.
  for _ in {1..20}; do
    if is_port_open "127.0.0.1" "27017"; then
      echo "mongo reachable on 127.0.0.1:27017"
      return 0
    fi
    sleep 1
  done

  echo "mongo container started but port 27017 is still unreachable"
  return 1
}

# Lance un service applicatif en arrière-plan avec :
# - un PID file pour le stop/status
# - un fichier de log dédié
start_service() {
  local name="$1"
  local workdir="$2"
  local pid_file="$RUN_DIR/${name}.pid"
  local log_file="$LOG_DIR/${name}.log"
  shift 2

  # Si le PID file existe encore mais que le process n'existe plus, on le nettoie.
  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if kill -0 "$existing_pid" 2>/dev/null; then
      echo "$name already running (pid $existing_pid)"
      return 0
    fi
    rm -f "$pid_file"
  fi

  (
    cd "$workdir"
    nohup "$@" >"$log_file" 2>&1 &
    echo $! >"$pid_file"
  )

  local pid
  pid="$(cat "$pid_file")"
  echo "Started $name (pid $pid)"
  echo "  log: $log_file"
}

# Ordre volontaire :
# 1. Mongo
# 2. bridge (dépend de Mongo)
# 3. frontend
start_mongo
start_service "bridge" "$ROOT_DIR/bridge" npm run dev
start_service "frontend" "$ROOT_DIR/bridge/frontend" npm run dev -- --host 0.0.0.0

cat <<EOF

Services:
  MongoDB:  mongodb://localhost:27017/wp-builder
  Bridge:   http://localhost:3000
  Frontend: http://localhost:5173
  n8n:      http://localhost:5678

Commands:
  Stop:     $ROOT_DIR/scripts/stop-dev.sh
  Status:   $ROOT_DIR/scripts/status-dev.sh
EOF
