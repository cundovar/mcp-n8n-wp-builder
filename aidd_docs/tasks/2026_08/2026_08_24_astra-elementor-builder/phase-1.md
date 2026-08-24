---
status: done
---

# Instruction: Synchronize live workflows

## Architecture projection

```txt
automation/workflows/10-wordpress-infrastructure.json ✏️
automation/workflows/20-wordpress-builder.json ✏️
automation/workflows/30-wordpress-review.json ✏️
automation/workflows/35-wordpress-correction-loop.json ✏️
docs/workflow-inventory.md ✅
```

## Tasks to do

### `1)` Capture live state

1. Back up every remote workflow with a checksum manifest.
2. Synchronize the four divergent tracked workflows.
3. Document the status of the three active wp-builder-v2 workflows.
4. Verify semantic hashes against live n8n.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | The private remote backup contains all workflows and a checksum manifest. |
| 2 | The six tracked pipeline workflows have the same semantic hashes as live n8n. |
| 3 | The untracked active workflows have an explicit lifecycle decision and are not silently deleted. |
