#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

cat > "$TMP_DIR/chromium" <<'MOCK'
#!/bin/bash
set -euo pipefail
for arg in "$@"; do
  case "$arg" in
    --screenshot=*) file="${arg#--screenshot=}" ;;
  esac
done
printf 'fake-png' > "$file"
MOCK
chmod +x "$TMP_DIR/chromium"

export CHROMIUM_BIN="$TMP_DIR/chromium"
export VISUAL_REVIEW_ROOT="$TMP_DIR/output"
export VISUAL_REVIEW_ALLOWED_HOSTS="wp-staging"

result=$(printf '%s' '{"request_id":"visual-test","base_url":"http://wp-staging","pages":[{"page_key":"home","path":"/"}]}' | node "$ROOT/automation/runners/visual-review-runner.mjs")
jq -e '.ok == true and (.captures | length) == 3 and all(.captures[]; .sha256 != null)' <<< "$result" >/dev/null

if printf '%s' '{"request_id":"visual-test","base_url":"http://169.254.169.254","pages":[{"page_key":"home","path":"/"}]}' | node "$ROOT/automation/runners/visual-review-runner.mjs" >/dev/null 2>&1; then
  echo "SSRF host should have been rejected" >&2
  exit 1
fi

echo "Visual review runner tests passed"
