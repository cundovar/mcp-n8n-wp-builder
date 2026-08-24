#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNNER="${ROOT}/automation/runners/wp-cli-build-runner.sh"
export STAGING_WP_PATH="/var/www/html"

run_validate() {
  printf '%s' "$1" | bash "$RUNNER" --validate-only
}

run_dry() {
  printf '%s' "$1" | bash "$RUNNER"
}

result=$(run_validate '{"request_id":"test-1","execution_mode":"dry_run","actions":[{"action":"import_starter_template","args":{"starter_template_id":123,"expected_builder":"elementor","expected_license":"free"}}]}')
jq -e 'length == 1 and .[0].ok == true and .[0].mutated == false' <<< "$result" >/dev/null

result=$(run_validate '{"request_id":"test-2","actions":[{"action":"import_starter_template","args":{"starter_template_id":123,"expected_builder":"elementor"}}]}')
jq -e '.[0].ok == false and .[0].error_type == "policy_violation"' <<< "$result" >/dev/null

result=$(run_validate '{"request_id":"test-3","actions":[{"action":"shell","args":{"command":"rm -rf /"}}]}')
jq -e '.[0].ok == false and .[0].error_type == "not_allowlisted"' <<< "$result" >/dev/null

result=$(run_dry '{"request_id":"test-4","execution_mode":"dry_run","actions":[{"action":"backup_site_build","args":{}},{"action":"ensure_astra_child_theme","args":{}},{"action":"import_starter_template","args":{"starter_template_id":123,"expected_builder":"elementor","expected_license":"free"}}]}')
jq -e 'length == 3 and all(.[]; .ok == true and .mutated == false)' <<< "$result" >/dev/null

result=$(run_validate '{"request_id":"bad;id","actions":[]}')
jq -e '.[0].error_type == "invalid_request_id"' <<< "$result" >/dev/null

echo "WP-CLI build runner tests passed"
