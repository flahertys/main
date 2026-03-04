#!/usr/bin/env bash
# convert-images-to-webp.sh
# Batch converts all PNG and JPG images in public/ to WebP format.
# Requires: cwebp (from the webp package)
#
# Usage:
#   chmod +x scripts/convert-images-to-webp.sh
#   ./scripts/convert-images-to-webp.sh
#
# Install cwebp:
#   Debian/Ubuntu:  sudo apt install webp
#   macOS:          brew install webp
#   Fedora/RHEL:    sudo dnf install libwebp-tools
#
# Options:
#   QUALITY  (env) WebP quality 0-100, default 82
#   KEEP_ORIGINALS  (env) Set to "1" to keep originals alongside .webp, default removes them

set -euo pipefail

QUALITY="${QUALITY:-82}"
KEEP_ORIGINALS="${KEEP_ORIGINALS:-0}"
PUBLIC_DIR="$(cd "$(dirname "$0")/.." && pwd)/public"

command -v cwebp >/dev/null 2>&1 || {
  echo "ERROR: cwebp not found. Install with: apt install webp  OR  brew install webp" >&2
  exit 1
}

echo "Converting images in ${PUBLIC_DIR} to WebP (quality=${QUALITY})..."

CONVERTED=0
SKIPPED=0

while IFS= read -r -d '' file; do
  dir="$(dirname "$file")"
  base="$(basename "$file")"
  name="${base%.*}"
  webp_path="${dir}/${name}.webp"

  if [[ -f "$webp_path" ]]; then
    echo "  SKIP  (already exists): ${webp_path#"$PUBLIC_DIR/"}"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  CONVERT: ${file#"$PUBLIC_DIR/"} -> ${name}.webp"
  cwebp -quiet -q "$QUALITY" "$file" -o "$webp_path"

  if [[ "$KEEP_ORIGINALS" != "1" ]]; then
    rm "$file"
    echo "           Removed original: ${base}"
  fi

  CONVERTED=$((CONVERTED + 1))
done < <(find "$PUBLIC_DIR" \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -not -path "*/node_modules/*" -print0)

echo ""
echo "Done. Converted: ${CONVERTED}, Skipped: ${SKIPPED}"
echo "Remember to update any <img src> or next/image src references to use .webp paths."
