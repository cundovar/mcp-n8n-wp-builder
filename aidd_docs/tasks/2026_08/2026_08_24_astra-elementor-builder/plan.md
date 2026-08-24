---
objective: "A validated contract imports an approved free Astra Elementor kit, applies approved design and content, passes visual review, and remains blocked from publication until human approval."
status: in-progress
---

# Plan: Astra Elementor site builder

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Synchronize live n8n workflows, then implement a safe Astra Starter Templates and Elementor construction pipeline across MCP_N8N and wp-mcp. |
| **Source** | User-approved inline plan, 2026-08-24 |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Synchronize live workflows | [`phase-1.md`](./phase-1.md) |
| 2 | Astra catalogue and restricted import | [`phase-2.md`](./phase-2.md) |
| 3 | WordPress and Elementor adaptation tools | [`phase-3.md`](./phase-3.md) |
| 4 | Orchestration, visual QA, and deployment | [`phase-4.md`](./phase-4.md) |

## Decisions

| Decision | Why |
| --- | --- |
| WP-CLI mutations stay in MCP_N8N runners, while WordPress-native mutations stay in wp-mcp. | Prevents shell execution from the WordPress HTTP process and preserves the existing security boundary. |
| Auto-selection in apply mode uses only internally validated free Elementor kits. | The remote Astra catalogue and dependencies can change. |
| Git push and n8n import remain separate operations. | A repository update must not silently mutate active automation. |
