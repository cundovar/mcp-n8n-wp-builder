# n8n workflow inventory

The repository is the reviewable source for workflow definitions, while the
active n8n instance remains a separately deployed runtime. A Git push does not
import or activate a workflow.

## Site planning workflows

| Workflow | ID | Status | Role |
| --- | --- | --- | --- |
| `wp-builder-v2` | `7NjF4vFxVsOHBcH8` | Active, tracked | Produces planning artifacts. |
| `wp-builder-v2-validation-loop` | `fUUjOAaResOiVPt2` | Active, tracked | Receives human validation decisions. |
| `wp-builder-v2-targeted-rebuild` | `iOFPfFZ19jOyTHm4` | Active, tracked | Rebuilds only rejected planning artifacts. |

These workflows are not legacy: they expose active webhooks and the planning
and validation workflows have successful executions. They feed approved
artifacts to the WordPress construction pipeline.

## Deployment rule

Before importing a tracked workflow:

1. Export the live workflow and record a checksum.
2. Compare its semantic hash with the expected pre-deployment hash.
3. Import only workflow IDs changed by the commit.
4. Confirm the live semantic hash matches the committed file.
5. Retain the export until a successful post-deployment execution.
