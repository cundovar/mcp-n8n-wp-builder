---
status: done
---

# Instruction: Astra catalogue and restricted import

## Architecture projection

```txt
automation/catalogs/astra-starter-kits.json ✅
automation/policies/wp-cli-allowlist.json ✏️
automation/runners/wp-cli-build-runner.sh ✏️
bridge/src/core/routes/infrastructure.js ✏️
bridge/src/core/services/infrastructureExecutor.js ✏️
```

## Tasks to do

### `1)` Add bounded Astra operations

1. List and normalize dynamic Starter Templates.
2. Select validated kits deterministically.
3. Back up, lock, create the Astra child theme, and import without free-form shell.
4. Provide explicit restore with no use of Starter Templates reset.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Dry-run is mutation-free and import rejects unknown, premium, non-Elementor, or disallowed dependencies. |
| 2 | Child-theme preparation and repeated import requests are idempotent. |
| 3 | A request-scoped backup can restore the pre-import state. |
