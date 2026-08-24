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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALLOWLIST="${SCRIPT_DIR}/../policies/wp-cli-allowlist.json"
INPUT=$(cat)
REQUEST_ID=$(echo "$INPUT" | jq -r '.request_id // ""')
EXECUTION_MODE=$(echo "$INPUT" | jq -r '.execution_mode // "dry_run"')
ACTION_COUNT=$(echo "$INPUT" | jq '.actions | length')
MAX_ACTIONS=$(jq -r '.max_actions_per_request' "$ALLOWLIST")

if ! echo "$REQUEST_ID" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$'; then
  jq -n '[{ok: false, error_type: "invalid_request_id", message: "request_id has an invalid format"}]'
  exit 0
fi
if [ "$EXECUTION_MODE" != "dry_run" ] && [ "$EXECUTION_MODE" != "apply" ]; then
  jq -n '[{ok: false, error_type: "invalid_execution_mode", message: "execution_mode must be dry_run or apply"}]'
  exit 0
fi

: "${STAGING_WP_PATH:?STAGING_WP_PATH not set}"
STAGING_BACKUP_ROOT="${STAGING_BACKUP_ROOT:-/var/backups/wp-mcp}"
if [ "$VALIDATE_ONLY" = false ] && [ "$EXECUTION_MODE" = "apply" ]; then
  : "${STAGING_SSH_HOST:?STAGING_SSH_HOST not set}"
  : "${STAGING_SSH_USER:?STAGING_SSH_USER not set}"
  : "${STAGING_SSH_KEY_PATH:?STAGING_SSH_KEY_PATH not set}"
fi

SSH="ssh -i ${STAGING_SSH_KEY_PATH:-} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 ${STAGING_SSH_USER:-}@${STAGING_SSH_HOST:-}"

RESULTS_FILE=$(mktemp)
trap 'rm -f "$RESULTS_FILE"' EXIT

snapshot_state() {
  local plugins themes
  plugins=$($SSH "wp plugin list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
  themes=$($SSH "wp theme list --path=${STAGING_WP_PATH} --format=json" 2>/dev/null || echo "[]")
  jq -n --argjson plugins "$plugins" --argjson themes "$themes" '{plugins: $plugins, themes: $themes}'
}

starter_templates_tsv_to_json() {
  jq -R -s '
    split("\n")
    | map(select(length > 0) | split("\t"))
    | if length < 2 then [] else
        .[0] as $headers
        | .[1:]
        | map(
            . as $row
            | reduce range(0; $headers | length) as $index
                ({}; . + {($headers[$index]): ($row[$index] // "")})
            | .id = (.id | tonumber)
          )
      end
  '
}

emit_execution_result() {
  local action_name="$1" exit_code="$2" duration_ms="$3" output="$4" before_state="$5" after_state="$6"
  local redacted_output
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

  if [ -z "$violation" ]; then
    while IFS= read -r required_arg; do
      [ -z "$required_arg" ] && continue
      if ! echo "$args_json" | jq -e --arg k "$required_arg" 'has($k)' >/dev/null; then
        violation="missing required argument \"$required_arg\" for action \"$action_name\""
        break
      fi
    done < <(echo "$allow_entry" | jq -r '.required_args[]?')
  fi

  if [ -n "$violation" ]; then
    jq -n --arg action "$action_name" --arg msg "$violation" \
      '{ok: false, action: $action, error_type: "policy_violation", message: $msg}' \
      >> "$RESULTS_FILE"
    continue
  fi

  if [ "$VALIDATE_ONLY" = true ] || [ "$EXECUTION_MODE" = "dry_run" ]; then
    jq -n --arg action "$action_name" --arg mode "$EXECUTION_MODE" \
      '{ok: true, action: $action, execution_mode: $mode, mutated: false, error_type: null, message: "passes allowlist validation"}' \
      >> "$RESULTS_FILE"
    continue
  fi

  handler=$(echo "$allow_entry" | jq -r '.handler // empty')
  if [ -n "$handler" ]; then
    before_state=$(snapshot_state)
    start_ms=$(date +%s%3N)
    set +e
    case "$handler" in
      list_starter_templates)
        catalog_tsv=$($SSH "wp starter-templates list --page-builder=elementor --type=free --per-page=100 --path=$(printf '%q' "$STAGING_WP_PATH")" 2>&1)
        exit_code=$?
        if [ "$exit_code" -eq 0 ]; then
          output=$(printf '%s\n' "$catalog_tsv" | starter_templates_tsv_to_json)
        else
          output="$catalog_tsv"
        fi
        ;;
      backup_site_build)
        backup_dir="${STAGING_BACKUP_ROOT}/${REQUEST_ID}"
        remote_cmd="set -e; umask 077; backup_dir=$(printf '%q' "$backup_dir"); wp_path=$(printf '%q' "$STAGING_WP_PATH"); if [ -f \"\$backup_dir/manifest.sha256\" ]; then echo backup_exists; exit 0; fi; mkdir -p \"\$backup_dir\"; wp db export \"\$backup_dir/database.sql\" --path=\"\$wp_path\"; tar -C \"\$wp_path\" -czf \"\$backup_dir/wp-content.tar.gz\" wp-content; sha256sum \"\$backup_dir/database.sql\" \"\$backup_dir/wp-content.tar.gz\" > \"\$backup_dir/manifest.sha256\""
        output=$($SSH "$remote_cmd" 2>&1)
        exit_code=$?
        ;;
      ensure_astra_child_theme)
        style_b64="LyoKVGhlbWUgTmFtZTogV1AgTUNQIEFzdHJhIENoaWxkClRlbXBsYXRlOiBhc3RyYQpWZXJzaW9uOiAxLjAuMApXUCBNQ1AgTWFuYWdlZDogdHJ1ZQoqLwo="
        functions_b64="PD9waHAKLyoqIFdQIE1DUCBtYW5hZ2VkIEFzdHJhIGNoaWxkIHRoZW1lLiAqLwo="
        child_dir="${STAGING_WP_PATH}/wp-content/themes/astra-wp-mcp-child"
        remote_cmd="set -e; wp_path=$(printf '%q' "$STAGING_WP_PATH"); child_dir=$(printf '%q' "$child_dir"); wp theme is-installed astra --path=\"\$wp_path\"; if [ -e \"\$child_dir/style.css\" ] && ! grep -q 'WP MCP Managed: true' \"\$child_dir/style.css\"; then echo unmanaged_child_theme >&2; exit 73; fi; mkdir -p \"\$child_dir\"; printf %s $(printf '%q' "$style_b64") | base64 -d > \"\$child_dir/style.css\"; printf %s $(printf '%q' "$functions_b64") | base64 -d > \"\$child_dir/functions.php\"; wp theme activate astra-wp-mcp-child --path=\"\$wp_path\""
        output=$($SSH "$remote_cmd" 2>&1)
        exit_code=$?
        ;;
      import_starter_template)
        starter_template_id=$(echo "$args_json" | jq -r '.starter_template_id')
        backup_dir="${STAGING_BACKUP_ROOT}/${REQUEST_ID}"
        lock_dir="/tmp/wp-mcp-site-build-${REQUEST_ID}.lock"
        catalog_tsv=$($SSH "wp starter-templates list --page-builder=elementor --type=free --per-page=100 --path=$(printf '%q' "$STAGING_WP_PATH")" 2>/dev/null)
        catalog_exit=$?
        catalog=$(printf '%s\n' "$catalog_tsv" | starter_templates_tsv_to_json)
        if [ "$catalog_exit" -ne 0 ] || ! echo "$catalog" | jq -e --argjson wanted "$starter_template_id" 'any(.[]; .id == $wanted and ((.type // "") | ascii_downcase) == "free" and ((.["page-builder"] // "") | ascii_downcase | contains("elementor")))' >/dev/null 2>&1; then
          output="starter template is unavailable, non-free, or not Elementor"
          exit_code=74
        else
          remote_cmd="set -e; backup_dir=$(printf '%q' "$backup_dir"); lock_dir=$(printf '%q' "$lock_dir"); wp_path=$(printf '%q' "$STAGING_WP_PATH"); test -f \"\$backup_dir/manifest.sha256\" || { echo backup_required >&2; exit 72; }; mkdir \"\$lock_dir\" || { echo site_build_locked >&2; exit 75; }; trap 'rmdir \"\$lock_dir\"' EXIT; wp starter-templates import $(printf '%q' "$starter_template_id") --yes --path=\"\$wp_path\""
          output=$($SSH "$remote_cmd" 2>&1)
          exit_code=$?
        fi
        ;;
      rollback_site_build)
        backup_request_id=$(echo "$args_json" | jq -r '.backup_request_id')
        backup_dir="${STAGING_BACKUP_ROOT}/${backup_request_id}"
        remote_cmd="set -e; backup_dir=$(printf '%q' "$backup_dir"); wp_path=$(printf '%q' "$STAGING_WP_PATH"); test -f \"\$backup_dir/database.sql\"; test -f \"\$backup_dir/wp-content.tar.gz\"; cd \"\$backup_dir\"; sha256sum -c manifest.sha256; wp db import \"\$backup_dir/database.sql\" --path=\"\$wp_path\"; tar -C \"\$wp_path\" -xzf \"\$backup_dir/wp-content.tar.gz\"; wp cache flush --path=\"\$wp_path\""
        output=$($SSH "$remote_cmd" 2>&1)
        exit_code=$?
        ;;
      *)
        output="unknown internal handler"
        exit_code=70
        ;;
    esac
    set -e
    end_ms=$(date +%s%3N)
    duration_ms=$((end_ms - start_ms))
    after_state=$(snapshot_state)
    emit_execution_result "$action_name" "$exit_code" "$duration_ms" "$output" "$before_state" "$after_state"
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

  emit_execution_result "$action_name" "$exit_code" "$duration_ms" "$output" "$before_state" "$after_state"
done

jq -s '.' "$RESULTS_FILE"
