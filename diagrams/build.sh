#!/bin/bash
# Compile D2 diagram sources (.d2) to SVG in public/diagrams/
# Usage: bash diagrams/build.sh
# Requires: d2 (https://d2lang.com)

set -euo pipefail

SRC_DIR="diagrams/src"
OUT_DIR="public/diagrams"

if ! command -v d2 &>/dev/null; then
  echo "⚠ d2 not found — skipping diagram compilation"
  echo "  Install: brew install d2  (or https://d2lang.com/install)"
  exit 0
fi

mkdir -p "$OUT_DIR"

count=0
for f in "$SRC_DIR"/*.d2; do
  [ -f "$f" ] || continue
  name="$(basename "$f" .d2)"
  d2 --layout=elk "$f" "$OUT_DIR/$name.svg" 2>&1
  count=$((count + 1))
done

echo "✓ Compiled $count D2 diagram(s) → $OUT_DIR/"
