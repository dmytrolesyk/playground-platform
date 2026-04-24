# Feature 12g: Cytoscape Knowledge Graph Integration (Enhancement)

_Status: Deferred — not part of core Feature 12 delivery_

## Goal

Add a Cytoscape.js filtered view to project-lab pages showing which knowledge graph concepts are covered by the project-lab.

## Rationale for Deferral

Knowledge graph concept edges come for free (phase files have `relatedConcepts` and `phaseConcepts` fields — the graph extractor already handles these). The *visualization* of "concepts covered by this project-lab" requires Cytoscape.js integration, which is a non-trivial extension of Feature 6. The core project-lab experience works without it.

## When to Build

After Feature 12e and after the Cytoscape.js graph (Feature 6) is stable. This is a "delight" feature that shows learners their progress through the concept landscape.

## Approach

**On the project-lab index page:**
- Collect all `phaseConcepts` from all phases
- Render a small Cytoscape.js instance showing only those concept nodes and their edges
- Highlight completed phases' concepts in a different color
- Lazy-load the Cytoscape instance (it's a heavy dependency)

**On phase pages:**
- A "Concepts in this phase" sidebar listing concept names with links
- No Cytoscape embed (too heavy for every phase page)

## Estimated Effort

Half day (mostly wiring up existing Cytoscape component with filtered data).
