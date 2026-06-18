#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"

# Auto-detect version from git if not provided
if [ -z "$VERSION" ]; then
  if git describe --tags --match "host-v*" --always &>/dev/null 2>/dev/null; then
    VERSION="$(git describe --tags --match "host-v*" --always 2>/dev/null | sed 's/^host-v//')"
  else
    VERSION="0.0.0-dev"
  fi
fi

echo "=============================================="
echo "  Nowly Native Host macOS Release v$VERSION"
echo "=============================================="
echo ""

# Detect the best available source icon
ICON_SOURCE=""
for candidate in \
  "$ROOT_DIR/../../apps/extension/src/icons/icon128.png" \
  "$ROOT_DIR/../../apps/web/public/apple-icon.png" \
  "$ROOT_DIR/../../apps/native/assets/icon.png"; do
  if [ -f "$candidate" ]; then
    ICON_SOURCE="$candidate"
    break
  fi
done

mkdir -p "$RELEASE_DIR"

# --------------- Step 1: Build both binaries ---------------
echo "=== Step 1/4: Build Go binaries ==="
bash "$SCRIPT_DIR/macos-build.sh" "$VERSION"

# --------------- Step 2+3: Bundle + DMG per architecture ---------------
# Build sequentially so the .app bundle is created fresh for each arch.
for ARCH in "amd64" "arm64"; do
  ARCH_LABEL="Intel"
  ARCH_TAG=""
  if [ "$ARCH" = "arm64" ]; then
    ARCH_LABEL="Apple Silicon"
    ARCH_TAG="-arm64"
  fi

  echo "=== Step 2-3/4: Bundle + DMG ($ARCH_LABEL) ==="

  bash "$SCRIPT_DIR/macos-bundle.sh" "$VERSION" "$ARCH" "$ICON_SOURCE"
  bash "$SCRIPT_DIR/macos-dmg.sh" "$ARCH"

  cp "$DIST_DIR/NowlyHost-macos$ARCH_TAG.dmg" "$RELEASE_DIR/"
  rm -rf "$DIST_DIR/Nowly Host.app"
done

echo ""
echo "=== macOS Release v$VERSION complete ==="
echo "Output: $RELEASE_DIR"
echo ""
ls -lh "$RELEASE_DIR/"
echo ""

# Print SHA-256 hashes
if command -v shasum &>/dev/null; then
  echo "SHA-256:"
  for f in "$RELEASE_DIR"/*; do
    echo "  $(shasum -a 256 "$f" | cut -d' ' -f1)  $(basename "$f")"
  done
fi
