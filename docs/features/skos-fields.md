# Feature: SKOS Vocabulary Fields

## Status: Complete

## Summary

Added SKOS-inspired vocabulary management fields and epistemic metadata to the knowledge article schema. This enables synonym discovery, conceptual hierarchy navigation, and trust indicators on articles.

## Schema Changes

### SKOS Fields (all optional with defaults)
- `prefLabel` — canonical display name (defaults to title)
- `altLabels` — synonyms, abbreviations, alternative names (`string[]`, default `[]`)
- `broader` — parent concepts in conceptual hierarchy (`string[]`, default `[]`)
- `narrower` — child concepts in conceptual hierarchy (`string[]`, default `[]`)
- `conceptScheme` — scopes concepts for multi-project future (default `'playground-platform'`)

### Epistemic Metadata Fields
- `confidence` — `'established' | 'probable' | 'uncertain' | 'speculative'` (default `'established'`)
- `evidenceType` — `'authoritative' | 'derived' | 'empirical' | 'analogical'` (optional)
- `isContested` — boolean (default `false`)

## Audit Rules Added

- `missing-broader-target` (error) — targets in `broader` must resolve to article IDs
- `missing-narrower-target` (error) — targets in `narrower` must resolve to article IDs
- `broader-narrower-symmetry` (error) — already existed from Feature 3, now fully active

## Graph Extraction

Two new edge types added:
- `broader` — from article to its broader concept
- `narrower` — from article to its narrower concept

## UI Treatment

- Articles with `confidence !== 'established'` show a yellow/red banner
- Articles with `isContested: true` show a contested-topic banner
- Broader/narrower concept links displayed in the related section

## Content Tagged

15 articles tagged with SKOS fields:
- 6 concepts with `altLabels`, `broader`/`narrower`, or `isContested`
- 5 technologies with `altLabels`
- 2 CS fundamentals with `altLabels` and `broader`/`narrower`
- 2 additional concepts with `altLabels`

## Search Integration

Deferred — no search exists yet. `altLabels` are designed to power synonym-aware search when Pagefind or Fuse.js is added. See TODO comment in `src/pages/learn/index.astro`.

## Files Modified

- `packages/knowledge-engine/src/schema.ts` — SKOS + epistemic fields
- `packages/knowledge-engine/src/audit/types.ts` — new issue codes + article fields
- `packages/knowledge-engine/src/audit/rules.ts` — broader/narrower link validation
- `packages/knowledge-engine/src/graph/types.ts` — broader/narrower in ArticleInput
- `packages/knowledge-engine/src/graph/extract.ts` — broader/narrower edge creation
- `scripts/knowledge-graph/load.ts` — pass broader/narrower to extraction
- `scripts/knowledge-graph/extract.test.ts` — broader/narrower edge tests
- `scripts/knowledge-audit/rules.test.ts` — link validation tests
- `src/pages/learn/[...slug].astro` — epistemic banner + broader/narrower display
- `src/pages/learn/index.astro` — search TODO comment
- `src/styles/learn.css` — epistemic banner styles
- `AGENTS.md` — relationship type guide, SKOS fields, epistemic metadata
- `docs/features/skos-fields.md` — this design doc
- 15 content articles — tagged with new fields
