#!/usr/bin/env bash
set -euo pipefail

# Lecture de l'état courant des services locaux.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
MONGO_MARKER="$RUN_DIR/mongo.container"

# Même test TCP léger que dans start-dev.sh.
is_port_open() {
  local host="$1"
  local port="$2"
  timeout 1 bash -c ":</dev/tcp/${host}/${port}" >/dev/null 2>&1
}

# Affiche l'état d'un service basé sur son PID file et son fichier de log.
show_service() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"
  local log_file="$LOG_DIR/${name}.log"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name: running (pid $pid)"
    else
      echo "$name: stale pid file (pid $pid)"
    fi
  else
    echo "$name: stopped"
  fi

  if [[ -f "$log_file" ]]; then
    echo "  log: $log_file"
  fi
}

show_service "bridge"
show_service "frontend"

# Mongo n'a pas de PID file projet, donc on le teste par accessibilité réseau.
if is_port_open "127.0.0.1" "27017"; then
  echo "mongo: reachable on 127.0.0.1:27017"
else
  echo "mongo: not reachable on 127.0.0.1:27017"
fi

# Si start-dev.sh a démarré un conteneur Mongo, on l'affiche ici.
if [[ -f "$MONGO_MARKER" ]]; then
  echo "  started by script: $(cat "$MONGO_MARKER")"
fi
