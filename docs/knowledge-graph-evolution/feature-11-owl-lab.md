# Feature 11: OWL Learning Lab

## Goal

Learn OWL by making it a topic IN the knowledge base — an article explaining ontology engineering and a hands-on lab building a small OWL ontology of the knowledge base's own concepts.

## Depends On

Feature 7 (SKOS fields — the article references SKOS as context for the formality spectrum). Content — stays outside the engine package.

## Applicable Skills

- `documentation` — writing the ontology engineering article (technical writing best practices)

## Deliverables

### 1. Article: `concepts/ontology-engineering.md`

A knowledge base article explaining:
- What ontology engineering is and how it relates to knowledge graphs
- The formality spectrum: flat tags → SKOS vocabulary → SHACL validation → OWL ontology
- How the playground-platform's own knowledge base maps to each level
- When each level is appropriate (and when OWL is overkill)
- Connection to existing articles: link to `cs-fundamentals/graph-validation.md` and SKOS-related content

Must follow all existing quality standards:
- Learning objectives (3+)
- Exercises (2-4, at least one `predict` or `do`)
- External references (3-6, mixed types)
- Mermaid diagram (at least 1)
- Minimum word count: 1000-1800 (concepts category)
- Module assignment (suggest: `learning-system-reliability` or a new module)

### 2. Lab: `labs/build-a-tiny-ontology.md`

Hands-on lab following the existing DO → OBSERVE → EXPLAIN structure:

**Setup:**
- Install Protégé (https://protege.stanford.edu/ — free, open source OWL editor from Stanford)
- Install owlready2: `pip install owlready2`

**Experiment 1: Build an ontology in Protégé**
- DO: Create classes: `KnowledgeArticle`, `Concept`, `Technology`, `Module`, `Lab`
- DO: Create properties: `hasPrerequisite`, `relatedTo`, `hasDifficulty`, `belongsToModule`
- DO: Create individuals representing 5-10 actual articles from the knowledge base
- OBSERVE: What does the class hierarchy look like? What relationships are visible?
- EXPLAIN: How does this compare to the JSON knowledge graph from Feature 1?

**Experiment 2: Run the reasoner**
- DO: Run HermiT reasoner in Protégé
- OBSERVE: Does it infer anything? Does it find inconsistencies?
- EXPLAIN: Why is the result likely uninteresting for a small, manually curated knowledge base? When WOULD reasoning be valuable?

**Experiment 3: Python script with owlready2**
- DO: Write a Python script that loads the OWL file and queries it
- OBSERVE: What can you ask the ontology that you can't ask the JSON graph?
- EXPLAIN: What's the practical difference between querying a JSON graph and querying an OWL ontology?

**Cleanup:** No code changes to the main project. The OWL file and Python script are learning artifacts.

### 3. Python Script: `scripts/owl-experiment.py`

A learning exercise script (not production tooling) that:
- Loads the OWL ontology file created in the lab
- Prints class hierarchy
- Runs HermiT reasoner
- Checks for inconsistencies
- Demonstrates a simple query

## External References to Include in Articles

- Protégé: https://protege.stanford.edu/
- owlready2 docs: https://owlready2.readthedocs.io/
- OWL 2 Overview: https://www.w3.org/TR/owl2-overview/
- SKOS Reference: https://www.w3.org/TR/skos-reference/
- rdflib docs: https://rdflib.readthedocs.io/

## Files to Create

- `src/content/knowledge/concepts/ontology-engineering.md`
- `src/content/knowledge/labs/build-a-tiny-ontology.md`
- `scripts/owl-experiment.py`
- `diagrams/ontology/knowledge-base.owl` (the OWL file created during the lab)

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/11-owl-lab`
2. Implement — write article, lab, and Python script. All content must pass audit.
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build` + `python3 scripts/owl-experiment.py`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Article meets all quality standards (word count, exercises, learning objectives, external refs, diagram)
- [ ] Lab follows DO → OBSERVE → EXPLAIN structure
- [ ] Lab has setup instructions, all three experiments, and cleanup
- [ ] Lab links to ≥2 theory articles (ontology-engineering + graph-validation)
- [ ] Python script runs and demonstrates OWL loading + reasoning
- [ ] `pnpm verify:knowledge` passes
- [ ] Both articles have correct frontmatter (category, prerequisites, module, etc.)
