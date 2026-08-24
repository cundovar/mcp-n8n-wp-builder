# Hybrid orchestration — operating this pipeline

Reference: `aidd_docs/tasks/2026_08/2026_08_22_n8n-wordpress-hybrid-orchestration/` in the `wp-mcp` repo (plan + phase 1-4 specs). This document covers how to run, trace, retry, and recover the pipeline once it is deployed — see `automation/STATUS.md` for the narrative of what was built and when.

## Pipeline overview

```
curl / future front-end
  → n8n "00-site-build-intake"        (validation, state machine, visible in n8n)
  → bridge (mcp-n8n-wp-builder)        (MongoDB persistence, independent state-machine guard)
  → n8n "10-wordpress-infrastructure"  (agent → WP-CLI allow-list → SSH staging)
  → n8n "20-wordpress-builder"         (agent → mcp-tool-policy → wp-mcp on staging)
  → n8n "30-wordpress-review"          (read-only agent + deterministic checks → approve/changes_requested)
  → n8n "35-wordpress-correction-loop" (bounded correction, only on changes_requested)
  → n8n "40-wordpress-publish"         (human approval gate → production adapter → smoke checks)
```

Decision logic (validation, state transitions, verdicts) lives in visible n8n Code/IF nodes, inspectable per execution. The bridge and WP-CLI runners only do storage and independent re-validation in depth — they never make a decision n8n hasn't already made once.

## Astra Starter Templates operations

The bridge exposes the versioned candidate catalogue at
`GET /infrastructure/site-kits` and deterministic selection at
`POST /infrastructure/site-kits/select`. Every infrastructure endpoint requires
the bridge execution token.

The WP-CLI runner accepts only structured actions. Astra imports use this order:

1. `list_starter_templates`
2. `backup_site_build`
3. `ensure_astra_child_theme`
4. `import_starter_template`

`import_starter_template` rechecks that the numeric ID is still listed as a
free Elementor site, requires the request-scoped backup, and takes an atomic
site lock. `rollback_site_build` restores that backup explicitly. The runner
never uses the Starter Templates destructive `--reset` option.

`execution_mode: dry_run` performs policy validation only and never opens SSH.
Apply-mode auto-selection rejects catalogue entries until they have been tested
on a clean WordPress fixture and promoted from `candidate` to `validated`.

## State machine

Defined in `automation/policies/build-state-policy.json`. Every transition is recorded in `contract.state_history` with `actor`, `at`, `reason`.

```
received → needs_input → received (resubmission loop)
received → awaiting_staging_approval → ready_for_staging → building
building → reviewing → awaiting_publish_approval → publishing → completed
reviewing → changes_requested → building (correction loop)
any state → failed (terminal)
```

## Triggering phase 4

All webhooks require the `X-Intake-Token` header (n8n credential **Site Build Intake Token**, id `TINskEJG2pAFYwcv` — same token as phases 1-3).

```bash
# 1. Review a completed build (build_state must be "reviewing")
curl -X POST https://n8n.varascundo.com/webhook/wordpress-review \
  -H "X-Intake-Token: ..." -d '{"request_id":"..."}'

# 2a. If verdict=approve: build_state is now awaiting_publish_approval. A human
#     reads contract.stage_artifacts.review_result and contract.stage_artifacts.build_checksum,
#     then approves publication with the exact checksum:
curl -X POST https://n8n.varascundo.com/webhook/wordpress-publish \
  -H "X-Intake-Token: ..." \
  -d '{"request_id":"...","actor":"human-reviewer","build_checksum":"fnv1a32:...","target_environment":"staging-passthrough","expiry":"2026-08-24T00:00:00Z"}'

# 2b. If verdict=changes_requested: build_state is now changes_requested.
curl -X POST https://n8n.varascundo.com/webhook/wordpress-correction \
  -H "X-Intake-Token: ..." -d '{"request_id":"..."}'
# This transitions back to building. Re-run step 1 to review again.
```

Chaining 1→2 is manual, same known gap as phases 1→2→3 (see `automation/STATUS.md` point 4) — executions take too long to block an HTTP response synchronously. An async trigger (n8n's own execution-completed webhook, or a poller) is the natural fix if this is automated later.

## Build checksum and why approvals can't go stale silently

`30-wordpress-review` recomputes `build_checksum` (a non-cryptographic FNV-1a fingerprint, see `publication-policy.json`) from `contract.stage_artifacts.build_manifest` on **every** run. Because `35-wordpress-correction-loop` merges corrected entries into that same manifest before handing control back to review, any correction cycle produces a new checksum on the next review pass. A publish approval naming an older checksum will never match — `POST /contracts/:id/approve-publish` rejects it with 409 automatically. There is no separate "revoke approval" step needed.

## Correction loop bound

`35-wordpress-correction-loop` reads `contract.stage_artifacts.correction_attempts` (default 0) and refuses to loop past **3** attempts (hard-coded in the workflow's "IF Attempts Exceeded" node — change it there if the policy needs tuning). On the 3rd rejection it transitions straight to `failed` with a `state_history` reason listing the unresolved findings — this **is** the escalation to a human in v1: there is no chat/email notification wired up yet, so an operator must be watching `GET /contracts/:id` or n8n's execution list. Wiring a real alert channel is a known follow-up (an "SMTP account" credential already exists in n8n, unused — see `STATUS.md` point 9).

## Production adapter (v1 is a stub, deliberately)

`plan.md` records the decision that the hosting-specific staging-to-production mechanism is unknown and must stay replaceable. `40-wordpress-publish`'s **"Invoke Production Adapter"** Code node implements a `staging-passthrough` default: it treats the already-reviewed staging build as the artifact of record and returns its own URL. This is not a real deployment.

To replace it for real hosting, edit that one Code node. Contract to preserve:

- **Input** (already in scope as `$('Validate Approval Fields').first().json`): `{ request_id, contract, manifest }` where `manifest` is the reviewed `build_manifest` array (`artifact_key`, `post_id`, `status`, `verified`, ...).
- **Output**: `{ ok: boolean, adapter: string, published_base_url: string|null, published_at: ISO string, note?: string }`. `ok: false` here should be treated as a hard publish failure — wire an `IF` after this node if a real adapter can fail (the current stub never does).

## Post-publish smoke checks

`40-wordpress-publish` re-reads every manifest entry via `get_post` after the adapter runs and checks:

- **availability** — every manifest post_id resolves.
- **page_count_matches_manifest** — no page silently missing.
- **manifest_readback** — per-artifact detail, stored as evidence.

**Not automated in v1** (recorded in every publish response under `not_automated_v1`, and in `publication-policy.json`): `navigation_path`, `form_submission_path`, `indexing_state`, `visual_regression`. These need a real browser/crawler tool that isn't wired into the pipeline yet — treat a v1 "smoke pass" as "the pages exist and read back correctly," not as full QA.

### Manual recovery on smoke-check failure

There is no automatic rollback. On failure the contract moves to `failed` with the specific check results in the reason and in `contract.stage_artifacts.publish_result`. To recover:

1. Inspect `GET /contracts/:id` — `stage_artifacts.publish_result.checks` shows exactly which artifact(s) failed.
2. If it's a transient issue (adapter target briefly unreachable), fix the underlying cause and re-run `POST /contracts/:id/transition` with `{"state":"awaiting_publish_approval","actor":"...","reason":"retrying after transient failure"}`, then re-trigger `wordpress-publish` with a fresh, valid `expiry`.
3. If the content itself is wrong, this is really a correction: transition back to `changes_requested` instead and run the correction loop again.

## Reviewer scope (independence)

`review-policy.json` restricts the reviewer to `list_posts`, `get_post`, `list_categories` — no tool that could mutate WordPress. The workflow never calls `upsert_post` or the publish-approval endpoint. Deterministic checks (required pages present, no unresolved placeholders in live content, every manifest entry verified) always override the review agent's own verdict when they fail — an agent cannot approve past a check it can't see or reason its way around.

## Credentials and locations (values intentionally not repeated here — public repo)

| Element | Where to find it |
| --- | --- |
| Webhook token, all phases (`X-Intake-Token`) | n8n credential **Site Build Intake Token** (id `TINskEJG2pAFYwcv`) |
| Internal bridge token (`X-Bridge-Token`) | n8n credential **Header Auth account** (id `32Y7qJF1EaigIR6t`); value in `/srv/config/mcp-n8n-wp-builder/.env` |
| WP-MCP staging token | n8n credential **WP Staging MCP Token** (id `Yo9eorpphgq9v3VJ`); WP option `wp_mcp_bearer_token` (hashed) on `wp-staging` |
| n8n workflow IDs | `30-wordpress-review` = `WPREVIEW4Phase0001` · `35-wordpress-correction-loop` = `WPCORRECT4Phase0001` · `40-wordpress-publish` = `WPPUBLISH4Phase0001` |

## Timeouts and retries

- Agent calls (`/task` with `engine: codex`) use `timeout_ms: 180000` (3 minutes), matching phases 2-3.
- `upsert_post` is idempotent by `(request_id, artifact_key)` — safe to retry any webhook call after a network failure; it will not duplicate content. `wp menu create` is a known exception (see `STATUS.md`), not relevant to phase 4.
- Bridge endpoints used here (`/transition`, `/stage-artifacts`, `/approve-publish`) are all idempotent no-ops when called again from the same state — see the "already in this state" / "already approved" responses in `contracts.js`.

## Evidence retention and redaction

`contract.state_history`, `stage_artifacts.review_result`, `stage_artifacts.publish_result`, and `stage_artifacts.publish_approval` are the audit trail — kept in MongoDB on the `Request` document indefinitely in v1 (no TTL configured). Review/publish payloads only ever contain the site's own generated content (page titles/HTML) and the approver's identity string (`actor`) — no end-customer PII is collected by this pipeline as designed. If a future contract schema adds customer-supplied data (e.g. a real client name/email in `business`), add a retention/redaction policy before that ships; nothing in phase 4 assumes it will stay PII-free forever.

## Deploying these workflows

`30-wordpress-review.json`, `35-wordpress-correction-loop.json`, and `40-wordpress-publish.json` were imported via `n8n import:workflow --input=...` and are present in this n8n instance but **inactive** — activate them from the n8n UI (toggle on each workflow) before triggering the webhooks above. They were left inactive deliberately: the `n8n` container's memory limit (`mem_limit: 600m` in `n8n/docker-compose.yml`, see `STATUS.md` point 8) is tight enough that CLI operations beyond a single-workflow import risk an OOM kill, so bulk/CLI activation was avoided in favor of the UI.
