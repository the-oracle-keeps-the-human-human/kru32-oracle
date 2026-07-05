#!/bin/bash
# build.sh — Compile all lessons and stage binaries for web flasher
#
# Usage: ./build.sh
# Requires: uvx esphome

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LESSONS_DIR="$(dirname "$SCRIPT_DIR")/lessons"
OUT_DIR="$SCRIPT_DIR/firmware"
MANIFESTS_DIR="$SCRIPT_DIR/manifests"

mkdir -p "$OUT_DIR" "$MANIFESTS_DIR"

declare -A LESSON_MAP=(
  ["basic"]="01-basic/basic.yaml"
  ["standard"]="02-standard/standard.yaml"
  ["intermediate"]="03-intermediate/intermediate.yaml"
  ["advanced"]="04-advanced/advanced.yaml"
  ["time"]="05-time/time-display.yaml"
  ["http"]="06-http/http-display.yaml"
  ["animation"]="07-animation/animation.yaml"
  ["gestures"]="08-gestures/gestures.yaml"
  ["themes"]="09-themes/themes.yaml"
  ["sensors"]="10-sensors/sensors.yaml"
  ["persistent"]="11-persistent/persistent.yaml"
  ["dashboard"]="15-dashboard/dashboard.yaml"
  ["production"]="16-production/production.yaml"
)

echo "=== Kru32 Oracle Web Flasher Build ==="
echo ""

for id in "${!LESSON_MAP[@]}"; do
  yaml="${LESSON_MAP[$id]}"
  dir="$LESSONS_DIR/$(dirname "$yaml")"
  file="$(basename "$yaml")"
  name="${file%.yaml}"

  echo "[$id] Compiling $yaml..."
  (cd "$dir" && uvx esphome compile "$file" 2>&1 | tail -1)

  # Find the factory bin
  factory=$(find "$dir/.esphome" -name "firmware.factory.bin" 2>/dev/null | head -1)
  if [ -n "$factory" ]; then
    cp "$factory" "$OUT_DIR/kru32-${id}.bin"
    size=$(du -h "$OUT_DIR/kru32-${id}.bin" | cut -f1)
    echo "  → kru32-${id}.bin ($size)"

    # Generate manifest
    cat > "$MANIFESTS_DIR/${id}.json" <<MANIFEST
{
  "name": "Kru32 Oracle — ${id}",
  "version": "1.0.0",
  "new_install_prompt_erase": true,
  "builds": [
    {
      "chipFamily": "ESP32-S3",
      "parts": [
        { "path": "../firmware/kru32-${id}.bin", "offset": 0 }
      ]
    }
  ]
}
MANIFEST
  else
    echo "  ✗ No factory bin found!"
  fi
  echo ""
done

echo "=== Done! ==="
echo "Serve with: cd $SCRIPT_DIR && python3 -m http.server 8080"
echo "Open: http://localhost:8080"
