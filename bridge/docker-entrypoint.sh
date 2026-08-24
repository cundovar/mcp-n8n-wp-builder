#!/bin/sh
set -e

# Les deux CLI ecrivent dans leur repertoire de config a chaque execution :
# codex y pose son etat au demarrage, claude y ecrit le transcript de session
# (~/.claude/projects/) et y clone le marketplace de plugins.
#
# Monter les repertoires de l'hote en :ro les casse donc, silencieusement pour
# claude (exit 0, mais transcripts perdus) et franchement pour codex
# ("failed to initialize in-process app-server client: Read-only file system").
# Les monter en :rw exposerait l'hote : 85 Mo d'historique projet pour claude,
# 1,2 Go de sessions pour codex.
#
# On amorce donc un HOME inscriptible propre au conteneur a partir des seuls
# fichiers d'authentification, montes en lecture seule. Les ecritures des CLI
# (refresh de token, transcripts, plugins) restent dans le conteneur.
seed() {
  src="$1"; dest="$2"
  [ -f "$src" ] || return 0
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  chmod 600 "$dest"
}

seed /seed/codex-auth.json "${HOME}/.codex/auth.json"
seed /seed/claude-credentials.json "${HOME}/.claude/.credentials.json"

exec "$@"
