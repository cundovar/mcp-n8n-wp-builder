#!/bin/sh
set -e

# codex refuse de demarrer si ~/.codex est en lecture seule : il y ecrit son
# etat au lancement ("failed to initialize in-process app-server client:
# Read-only file system"). On ne peut donc pas monter le ~/.codex de l'hote
# directement en :ro, et le copier entierement est exclu (1,2 Go de sessions
# et de cache).
#
# On amorce donc une copie inscriptible, propre au conteneur, a partir du seul
# fichier necessaire monte en lecture seule. Les ecritures de codex (refresh de
# token, etat) restent dans le conteneur et n'atteignent jamais l'hote.
if [ -f /seed/codex-auth.json ]; then
  mkdir -p "${HOME}/.codex"
  cp /seed/codex-auth.json "${HOME}/.codex/auth.json"
  chmod 600 "${HOME}/.codex/auth.json"
fi

exec "$@"
