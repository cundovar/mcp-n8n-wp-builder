---
status: done
---

# Instruction: Orchestration, visual QA, and deployment

## Architecture projection

```txt
automation/contracts/site-build-request.schema.json ✏️
automation/policies/mcp-tool-policy.json ✏️
automation/workflows/20-wordpress-builder.json ✏️
automation/workflows/30-wordpress-review.json ✏️
automation/workflows/35-wordpress-correction-loop.json ✏️
automation/runners/visual-review-runner.mjs ✅
```

## Tasks to do

### `1)` Wire the build lifecycle

1. Validate approved artifact versions and target-site constraints server-side.
2. Run preflight, backup, kit import, design, content, verification, and visual capture in order.
3. Restrict correction to rejected semantic targets and preserve original documents.
4. Block publication on critical or major findings, then deploy only modified workflows after backup.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Desktop, tablet, and mobile evidence exists for every expected page. |
| 2 | Major and critical defects block publication and stale approvals fail. |
| 3 | Both repositories pass their suites and the deployed workflow hashes match committed files. |
