#!/usr/bin/env bash
set -euo pipefail

# Même répertoire runtime que start-dev.sh.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
MONGO_MARKER="$RUN_DIR/mongo.container"

# Arrête un service lancé par start-dev.sh à partir de son PID file.
stop_service() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name not running"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "Stopped $name (pid $pid)"
  else
    echo "$name pid file stale (pid $pid)"
  fi

  rm -f "$pid_file"
}

stop_service "frontend"
stop_service "bridge"

# Par défaut on ne coupe pas Mongo, car il peut être partagé avec d'autres projets.
# Si on veut le stopper aussi, il faut passer --with-mongo.
if [[ "${1:-}" == "--with-mongo" && -f "$MONGO_MARKER" ]]; then
  container="$(cat "$MONGO_MARKER")"
  if [[ -n "$container" ]]; then
    docker stop "$container" >/dev/null && echo "Stopped mongo container ($container)"
  fi
  rm -f "$MONGO_MARKER"
fi
