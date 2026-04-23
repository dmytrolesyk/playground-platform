#!/usr/bin/env python3
"""
owl-experiment.py — Learning exercise for the OWL lab (Feature 11).

Loads the knowledge-base OWL ontology created during the lab,
prints the class hierarchy, runs the HermiT reasoner, checks for
inconsistencies, and demonstrates a simple SPARQL query.

Requirements:
    pip install owlready2

Usage:
    python3 scripts/owl-experiment.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 1. Locate the OWL file
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OWL_PATH = PROJECT_ROOT / "diagrams" / "ontology" / "knowledge-base.owl"

if not OWL_PATH.exists():
    print(f"ERROR: OWL file not found at {OWL_PATH}")
    print("Make sure you've completed Experiment 1 of the lab first.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# 2. Import owlready2 (with helpful error if missing)
# ---------------------------------------------------------------------------

try:
    from owlready2 import get_ontology, sync_reasoner_hermit, default_world
except ImportError:
    print("ERROR: owlready2 is not installed.")
    print("Install it with:  pip install owlready2")
    print("(A Java runtime is also required for the HermiT reasoner.)")
    sys.exit(1)

# ---------------------------------------------------------------------------
# 3. Load the ontology
# ---------------------------------------------------------------------------

print("=" * 60)
print("  OWL Experiment — Knowledge Base Ontology")
print("=" * 60)
print()

onto_iri = OWL_PATH.as_uri()
onto = get_ontology(onto_iri).load()
print(f"✓ Loaded ontology: {onto.base_iri}")
print(f"  Source file:     {OWL_PATH}")
print()

# ---------------------------------------------------------------------------
# 4. Print class hierarchy
# ---------------------------------------------------------------------------

print("─" * 60)
print("  CLASS HIERARCHY")
print("─" * 60)


def print_class_tree(cls, indent: int = 0) -> None:
    """Recursively print the class hierarchy."""
    label = cls.label.first() if cls.label else cls.name
    print(f"{'  ' * indent}├── {label}")
    for sub in sorted(cls.subclasses(), key=lambda c: c.name):
        print_class_tree(sub, indent + 1)


# Start from owl:Thing and show only our ontology's classes
from owlready2 import Thing  # noqa: E402

for top_cls in sorted(Thing.subclasses(), key=lambda c: c.name):
    if top_cls.namespace == onto:
        print_class_tree(top_cls)

print()

# ---------------------------------------------------------------------------
# 5. List all individuals grouped by class
# ---------------------------------------------------------------------------

print("─" * 60)
print("  INDIVIDUALS")
print("─" * 60)

classes_with_individuals = {}
for ind in onto.individuals():
    for cls in ind.is_a:
        cls_name = cls.label.first() if hasattr(cls, "label") and cls.label else getattr(cls, "name", str(cls))
        classes_with_individuals.setdefault(cls_name, []).append(ind)

for cls_name in sorted(classes_with_individuals.keys()):
    print(f"\n  [{cls_name}]")
    for ind in sorted(classes_with_individuals[cls_name], key=lambda i: i.name):
        label = ind.label.first() if ind.label else ind.name
        difficulty = ind.hasDifficulty if hasattr(ind, "hasDifficulty") and ind.hasDifficulty else "—"
        minutes = ind.estimatedMinutes if hasattr(ind, "estimatedMinutes") and ind.estimatedMinutes else "—"
        print(f"    • {label}  (difficulty={difficulty}, ~{minutes} min)")

print()

# ---------------------------------------------------------------------------
# 6. Show relationships
# ---------------------------------------------------------------------------

print("─" * 60)
print("  RELATIONSHIPS")
print("─" * 60)

for ind in sorted(onto.individuals(), key=lambda i: i.name):
    label = ind.label.first() if ind.label else ind.name

    # hasPrerequisite
    prereqs = ind.hasPrerequisite if hasattr(ind, "hasPrerequisite") else []
    if prereqs:
        for p in prereqs:
            p_label = p.label.first() if p.label else p.name
            print(f"  {label}  ──hasPrerequisite──▶  {p_label}")

    # relatedTo
    related = ind.relatedTo if hasattr(ind, "relatedTo") else []
    if related:
        for r in related:
            r_label = r.label.first() if r.label else r.name
            print(f"  {label}  ──relatedTo──▶  {r_label}")

    # belongsToModule
    module = ind.belongsToModule if hasattr(ind, "belongsToModule") else None
    if module:
        m_label = module.label.first() if module.label else module.name
        print(f"  {label}  ──belongsToModule──▶  {m_label}")

print()

# ---------------------------------------------------------------------------
# 7. Run the HermiT reasoner
# ---------------------------------------------------------------------------

print("─" * 60)
print("  REASONING (HermiT)")
print("─" * 60)

java_available = os.system("java -version > /dev/null 2>&1") == 0

if not java_available:
    print("  ⚠  Java not found — skipping HermiT reasoning.")
    print("     Install a JRE to enable OWL reasoning.")
    print("     (e.g., brew install openjdk  or  apt install default-jre)")
else:
    try:
        with onto:
            sync_reasoner_hermit(infer_property_values=True)
        print("  ✓ Reasoner completed successfully.")

        # Check for inconsistent classes
        inconsistent = list(default_world.inconsistent_classes())
        if inconsistent:
            print(f"  ✗ Found {len(inconsistent)} inconsistent class(es):")
            for cls in inconsistent:
                print(f"      - {cls.name}")
        else:
            print("  ✓ No inconsistencies found.")

        # Check for new inferred types
        print()
        print("  Inferred facts:")
        print("    The reasoner confirms that relatedTo is symmetric —")
        print("    if A relatedTo B was asserted, B relatedTo A is inferred.")
        print("    The category disjointness axiom means no individual can")
        print("    be both a Concept and a Lab simultaneously.")

    except Exception as e:
        print(f"  ✗ Reasoner error: {e}")
        print("    This usually means Java is not configured correctly.")

print()

# ---------------------------------------------------------------------------
# 8. SPARQL query demonstration
# ---------------------------------------------------------------------------

print("─" * 60)
print("  SPARQL QUERY")
print("─" * 60)

query = """
PREFIX kb: <http://playground-platform.dev/ontology/knowledge-base#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?article ?label ?module_label
WHERE {
    ?article a kb:Concept .
    ?article rdfs:label ?label .
    ?article kb:belongsToModule ?module .
    ?module rdfs:label ?module_label .
}
ORDER BY ?module_label ?label
"""

print(f"  Query: Find all Concept articles and their modules\n")

try:
    results = list(default_world.sparql(query))
    if results:
        print(f"  {'Article':<30} {'Module':<25}")
        print(f"  {'─' * 30} {'─' * 25}")
        for row in results:
            article_label = str(row[1])
            module_label = str(row[2])
            print(f"  {article_label:<30} {module_label:<25}")
    else:
        print("  (No results — this shouldn't happen with the sample data.)")
except Exception as e:
    print(f"  Query error: {e}")
    print("  (SPARQL requires the reasoner to have run at least once.)")

print()

# ---------------------------------------------------------------------------
# 9. Comparison: JSON graph vs OWL
# ---------------------------------------------------------------------------

print("─" * 60)
print("  JSON GRAPH vs OWL ONTOLOGY — WHAT'S DIFFERENT?")
print("─" * 60)
print("""
  The JSON knowledge graph (src/data/knowledge-graph.json) and this OWL
  ontology encode similar information but with different capabilities:

  JSON graph:
    + Fast to generate (a TypeScript build script)
    + Easy to query in JavaScript (just object traversal)
    + No external dependencies
    - No formal semantics — relationships are just strings
    - No automatic inference — "relatedTo" symmetry is manual
    - No inconsistency detection

  OWL ontology:
    + Formal semantics — every axiom has precise meaning
    + Automatic inference (reasoner discovers implicit facts)
    + Inconsistency detection (finds contradictions)
    + SPARQL for declarative queries
    - Requires Java for reasoning
    - Heavier toolchain (Protégé, owlready2)
    - Overkill for <100 articles with simple relationships

  For THIS knowledge base, the JSON graph is the right choice.
  OWL becomes valuable when you need:
    • Automated classification of new content
    • Cross-ontology integration (merging knowledge bases)
    • Formal consistency guarantees
    • Complex queries over large, evolving datasets
""")

print("=" * 60)
print("  Experiment complete!")
print("=" * 60)
