# Feature: D2 Diagrams + Generated Diagrams from Graph Data

## Status: Implemented

## Summary

Adds D2 as a diagram tool for standalone architectural diagrams and auto-generates Mermaid diagram files from the knowledge graph data at build time.

## Design Decisions

### D2 for standalone diagrams, Mermaid for inline
- D2 excels at nested container layouts (architecture layers, subsystems)
- Mermaid remains the default for inline article diagrams (zero build deps, client-side)
- D2 requires CLI installation (`brew install d2`), so the build script gracefully skips if absent

### Generated diagrams as derived artifacts
- Mermaid `.mmd` files generated from `knowledge-graph.json` at build time
- Gitignored — regenerated on every `pnpm prebuild`
- Covers: module prerequisites, per-module article DAGs, technology usage, category distribution

### D2 SVGs committed to git
- D2 compilation requires the `d2` CLI which won't be in Docker/CI
- SVGs are committed as static assets so they're always available
- `pnpm build:diagrams` is a manual step (not part of prebuild)

## Files

### Created
- `diagrams/src/architecture-overview.d2` — Three-layer platform architecture
- `diagrams/src/module-prerequisites.d2` — Curriculum module prerequisite structure
- `diagrams/build.sh` — D2 compilation script
- `scripts/generate-diagrams.ts` — Mermaid generation from graph JSON
- `scripts/generate-diagrams.test.ts` — Unit tests (11 tests)
- `src/pages/learn/diagrams.astro` — Diagrams gallery page
- `docs/features/d2-diagrams.md` — This file

### Modified
- `package.json` — Added `build:diagrams`, `generate:diagrams` scripts; updated `prebuild`
- `.gitignore` — Added `src/data/generated-diagrams/`
- `src/layouts/LearnLayout.astro` — Added 📊 Diagrams link to nav
- `AGENTS.md` — Added diagram tool selection and generated diagrams sections
