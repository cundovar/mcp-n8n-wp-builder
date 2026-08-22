#!/bin/bash
# Phase 2 health check: is the staging WordPress reachable, installed, and
# in a sane state? Read-only, no arguments accepted (nothing to inject).
set -euo pipefail

: "${STAGING_SSH_HOST:?STAGING_SSH_HOST not set}"
: "${STAGING_SSH_USER:?STAGING_SSH_USER not set}"
: "${STAGING_SSH_KEY_PATH:?STAGING_SSH_KEY_PATH not set}"
: "${STAGING_WP_PATH:?STAGING_WP_PATH not set}"

SSH="ssh -i ${STAGING_SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 ${STAGING_SSH_USER}@${STAGING_SSH_HOST}"

installed="false"
if $SSH "wp core is-installed --path=${STAGING_WP_PATH}" >/dev/null 2>&1; then
  installed="true"
fi

plugins="[]"
themes="[]"
if [ "$installed" = "true" ]; then
  plugins=$($SSH "wp plugin list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
  themes=$($SSH "wp theme list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
fi

jq -n \
  --arg installed "$installed" \
  --argjson plugins "$plugins" \
  --argjson themes "$themes" \
  '{ok: ($installed == "true"), installed: ($installed == "true"), plugins: $plugins, themes: $themes}'
