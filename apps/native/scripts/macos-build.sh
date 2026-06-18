#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-0.0.0-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

LDFLAGS="-X nowly.client/native/internal/contract.HostVersion=$VERSION"

echo ">> Building macOS binaries (v$VERSION)..."
mkdir -p "$DIST_DIR"

GOOS=darwin GOARCH=amd64 go build -ldflags "$LDFLAGS" -o "$DIST_DIR/nowly-host-darwin" ./cmd/host
echo "   ✔ nowly-host-darwin (Intel)"

GOOS=darwin GOARCH=arm64 go build -ldflags "$LDFLAGS" -o "$DIST_DIR/nowly-host-darwin-arm64" ./cmd/host
echo "   ✔ nowly-host-darwin-arm64 (Apple Silicon)"

echo ""
