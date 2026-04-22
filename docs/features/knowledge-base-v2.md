# Feature: Knowledge Base v2 — Superseded

## Status
Superseded

This document is retained as historical context only. Its active guidance has been merged into `docs/features/knowledge-base.md`, which is now the canonical Knowledge Base system document.

Do not treat this file as a competing source of truth. For current requirements, use:

- `docs/features/knowledge-base.md` — canonical content model, quality standards, audit, mastery progress, Architecture Explorer graph contract, and e2e expectations
- `docs/feature-development.md` — feature lifecycle and mandatory knowledge expansion checklist
- `AGENTS.md` — non-discoverable rules for agents

## Historical Summary

The v2 effort transformed the knowledge base from passive documentation into a learning system by adding:

- `cs-fundamentals/` and `labs/` content categories
- `learningObjectives`, `prerequisites`, `exercises`, `estimatedMinutes`, `module`, and `moduleOrder` frontmatter
- curriculum modules in `src/content/knowledge/modules.ts`
- local `localStorage` progress tracking
- lab and exercise quality standards
- mandatory knowledge expansion for every new feature

Those requirements are still active, but they now live in the canonical Knowledge Base spec.

## Follow-Up

The later Knowledge Reliability & Mastery work added:

- `pnpm verify:knowledge`
- graph and prerequisite validation
- staged progress (`read`, `checked`, `practiced`, `mastered`)
- `/learn`, Library, and Architecture Explorer e2e coverage
- renderer-agnostic Architecture Explorer graph rules

Those requirements are also merged into `docs/features/knowledge-base.md`.
