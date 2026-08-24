---
objective: "Make project detail and progress views concise, non-duplicative, and driven by the backend's canonical contract and artifact data."
status: in-progress
---

# Plan: Project detail and pipeline alignment

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Replace the obsolete pipeline display and remove duplicated project-detail controls. |
| **Source** | User request concerning `#/requests/1774553c-b247-4158-86fd-11410176f42f/detail` and `/pipeline` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Backend-aligned project progress | [`phase-1.md`](./phase-1.md) |
| 2 | Concise project overview | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Use `contract.state_history` as the build timeline | It is the canonical lifecycle written by the active workflows. |
| Treat artifacts as plan deliverables, not pipeline states | Artifact generation and staging execution are separate backend concerns. |
| Show an honest legacy fallback | Older requests have neither contract history nor enough data to reconstruct past phases. |
