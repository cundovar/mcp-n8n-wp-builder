---
objective: "Turn WP Site Builder into a clear, accessible project workspace aligned with the Astra/Elementor staging lifecycle."
status: implemented
---

# Plan: WP Builder frontend UX overhaul

## Scope

| Phase | Outcome | File |
| --- | --- | --- |
| 1 | Application shell, navigation, shared statuses, and user-visible errors | [`phase-1.md`](./phase-1.md) |
| 2 | Guided request wizard and project workspace with visual review | [`phase-2.md`](./phase-2.md) |
| 3 | Execution clarity, accessibility, responsive polish, and validation | [`phase-3.md`](./phase-3.md) |

## Constraints

- Keep the existing backend API compatible.
- Represent staging and publication as distinct states.
- Preserve artifact, revision, validation, and execution capabilities.
- Keep provisioning WordPress and its database as a deferred workflow before workflow `10`.
