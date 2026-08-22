#!/bin/bash
# Phase 2 staging runner. Reads {"request_id": "...", "actions": [{"action":
# "...", "args": {...}}]} on stdin -- never free-form shell text. Each action
# name and its arguments are re-validated here against wp-cli-allowlist.json,
# independently of whatever check n8n already did upstream (defense in
# depth: this script must be safe to call even if the caller is wrong).
#
# Emits a JSON array on stdout, one object per action, with before/after
# state, exit status and duration -- never a bare pass/fail.
set -euo pipefail

# --validate-only: check every action against the allowlist (same code path,
# same regexes) but never touch SSH or the staging site. Lets n8n show a
# real pass/fail per action -- from the one authoritative implementation --
# before committing to the (slower, side-effecting) full run.
VALIDATE_ONLY=false
if [ "${1:-}" = "--validate-only" ]; then
  VALIDATE_ONLY=true
fi

: "${STAGING_WP_PATH:?STAGING_WP_PATH not set}"
if [ "$VALIDATE_ONLY" = false ]; then
  : "${STAGING_SSH_HOST:?STAGING_SSH_HOST not set}"
  : "${STAGING_SSH_USER:?STAGING_SSH_USER not set}"
  : "${STAGING_SSH_KEY_PATH:?STAGING_SSH_KEY_PATH not set}"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALLOWLIST="${SCRIPT_DIR}/../policies/wp-cli-allowlist.json"
SSH="ssh -i ${STAGING_SSH_KEY_PATH:-} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 ${STAGING_SSH_USER:-}@${STAGING_SSH_HOST:-}"

INPUT=$(cat)
REQUEST_ID=$(echo "$INPUT" | jq -r '.request_id')
ACTION_COUNT=$(echo "$INPUT" | jq '.actions | length')
MAX_ACTIONS=$(jq -r '.max_actions_per_request' "$ALLOWLIST")

RESULTS_FILE=$(mktemp)
trap 'rm -f "$RESULTS_FILE"' EXIT

snapshot_state() {
  local plugins themes
  plugins=$($SSH "wp plugin list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
  themes=$($SSH "wp theme list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
  jq -n --argjson plugins "$plugins" --argjson themes "$themes" '{plugins: $plugins, themes: $themes}'
}

if [ "$ACTION_COUNT" -gt "$MAX_ACTIONS" ]; then
  jq -n --arg msg "request has $ACTION_COUNT actions, max is $MAX_ACTIONS" \
    '[{ok: false, error_type: "too_many_actions", message: $msg}]'
  exit 0
fi

for i in $(seq 0 $((ACTION_COUNT - 1))); do
  action_json=$(echo "$INPUT" | jq -c ".actions[$i]")
  action_name=$(echo "$action_json" | jq -r '.action')
  args_json=$(echo "$action_json" | jq -c '.args // {}')

  allow_entry=$(jq -c --arg a "$action_name" '.actions[$a] // empty' "$ALLOWLIST")

  if [ -z "$allow_entry" ]; then
    jq -n --arg action "$action_name" \
      '{ok: false, action: $action, error_type: "not_allowlisted", message: ("action \"" + $action + "\" is not in wp-cli-allowlist.json")}' \
      >> "$RESULTS_FILE"
    continue
  fi

  # Validate every provided arg against its pattern in the allowlist, and
  # against the global denied patterns. Any failure blocks this action only
  # -- it never reaches SSH.
  violation=""
  arg_names=$(echo "$args_json" | jq -r 'keys[]')
  for arg_name in $arg_names; do
    arg_value=$(echo "$args_json" | jq -r --arg k "$arg_name" '.[$k]')
    pattern=$(echo "$allow_entry" | jq -r --arg k "$arg_name" '.args[$k] // empty')

    if [ -z "$pattern" ]; then
      violation="unexpected argument \"$arg_name\" for action \"$action_name\""
      break
    fi
    if ! echo "$arg_value" | grep -qE "$pattern"; then
      violation="argument \"$arg_name\" value does not match required pattern"
      break
    fi
    while IFS= read -r denied; do
      [ -z "$denied" ] && continue
      if echo "$arg_value" | grep -qE "$denied"; then
        violation="argument \"$arg_name\" contains a denied pattern"
        break 2
      fi
    done < <(jq -r '.denied_arg_patterns[]' "$ALLOWLIST")
  done

  if [ -n "$violation" ]; then
    jq -n --arg action "$action_name" --arg msg "$violation" \
      '{ok: false, action: $action, error_type: "policy_violation", message: $msg}' \
      >> "$RESULTS_FILE"
    continue
  fi

  if [ "$VALIDATE_ONLY" = true ]; then
    jq -n --arg action "$action_name" \
      '{ok: true, action: $action, error_type: null, message: "passes allowlist validation"}' \
      >> "$RESULTS_FILE"
    continue
  fi

  # Substitute {placeholders} in the wp_command template with the validated args.
  cmd_parts=$(echo "$allow_entry" | jq -r '.wp_command[]')
  final_args=()
  while IFS= read -r part; do
    substituted="$part"
    for arg_name in $arg_names; do
      arg_value=$(echo "$args_json" | jq -r --arg k "$arg_name" '.[$k]')
      substituted="${substituted//\{$arg_name\}/$arg_value}"
    done
    final_args+=("$substituted")
  done <<< "$cmd_parts"

  # The SSH command travels as one string and gets re-parsed by a shell on
  # the remote end -- each part must be individually shell-quoted here, or
  # any value containing spaces/quotes silently splits into extra wp-cli
  # positional arguments on the other side.
  remote_cmd="wp"
  for part in "${final_args[@]}"; do
    remote_cmd+=" $(printf '%q' "$part")"
  done
  remote_cmd+=" --path=$(printf '%q' "$STAGING_WP_PATH")"

  before_state=$(snapshot_state)
  start_ms=$(date +%s%3N)
  set +e
  output=$($SSH "$remote_cmd" 2>&1)
  exit_code=$?
  set -e
  end_ms=$(date +%s%3N)
  duration_ms=$((end_ms - start_ms))
  after_state=$(snapshot_state)

  # Redact anything that looks like a credential before it leaves this host.
  redacted_output=$(echo "$output" | sed -E 's/(PASSWORD|SECRET|TOKEN|KEY)[=:][^[:space:]]+/\1=[redacted]/gi')

  jq -n \
    --arg action "$action_name" \
    --argjson ok "$([ "$exit_code" -eq 0 ] && echo true || echo false)" \
    --arg output "$redacted_output" \
    --argjson exit_code "$exit_code" \
    --argjson duration_ms "$duration_ms" \
    --argjson before "$before_state" \
    --argjson after "$after_state" \
    '{ok: $ok, action: $action, exit_code: $exit_code, duration_ms: $duration_ms, output: $output, before: $before, after: $after}' \
    >> "$RESULTS_FILE"
done

jq -s '.' "$RESULTS_FILE"
