---
status: pending
---

# Instruction: WordPress and Elementor adaptation tools

## Architecture projection

```txt
../MCP_WORDPRESS/wp-mcp/includes/tools/class-site-builder-tool.php ✅
../MCP_WORDPRESS/wp-mcp/includes/class-mcp-server.php ✏️
../MCP_WORDPRESS/wp-mcp/tests/site-builder-tool-test.php ✅
```

## Tasks to do

### `1)` Add guarded site adaptation

1. Apply the Elementor global design system through Elementor APIs.
2. Replace semantic content while preserving widget IDs.
3. Ensure expected pages and navigation without duplicates.
4. Inspect the build for placeholders, unavailable widgets, broken media, and Elementor editability.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Every mutation is capability-checked, validated, revision-aware, and idempotent. |
| 2 | Dangerous HTML, Pro-only unavailable widgets, and out-of-scope semantic targets are rejected. |
| 3 | Existing Elementor snapshot, rollback, and CSS regeneration behavior remains green. |

