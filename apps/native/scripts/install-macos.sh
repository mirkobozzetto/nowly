#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/../.env" ] && source "$SCRIPT_DIR/../.env"

HOST_NAME="nowly.client"
BINARY_NAME="nowly-host"
BINARY_SRC="${1:-dist/nowly-host-darwin}"

INSTALL_DIR="${HOME}/Library/Application Support/NowlyClient"
MANIFEST_DIRS=(
  "${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "${HOME}/Library/Application Support/Chromium/NativeMessagingHosts"
  "${HOME}/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "${HOME}/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
)
# Firefox uses allowed_extensions (UUID) and a separate directory
FIREFOX_MANIFEST_DIR="${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts"
FIREFOX_EXT_ID_DEV="{01146c8d-3101-0d92-01dc-29c0c0e5510c}"  # derived from Chrome dev ID abbegmindbabanjcabnmcjmamaoffbam
# FIREFOX_EXT_ID_PROD="nowly@nowly.me"  # TODO: add when AMO listing is created

if [ ! -f "$BINARY_SRC" ]; then
  echo "Error: binary not found at $BINARY_SRC"
  echo "Usage: $0 [path-to-binary]"
  echo ""
  echo "  First build the binary:"
  echo "    make build/darwin        # Intel"
  echo "    make build/darwin-arm    # Apple Silicon"
  echo "    # or"
  echo "    GOOS=darwin GOARCH=amd64 go build -o dist/nowly-host-darwin ./cmd/host"
  echo "    GOOS=darwin GOARCH=arm64 go build -o dist/nowly-host-darwin-arm64 ./cmd/host"
  exit 1
fi

echo "Installing Nowly Native Host for macOS..."

mkdir -p "$INSTALL_DIR"
cp "$BINARY_SRC" "${INSTALL_DIR}/${BINARY_NAME}"
chmod 755 "${INSTALL_DIR}/${BINARY_NAME}"

MANIFEST=$(cat <<MANIFEST_END
{
  "name": "${HOST_NAME}",
  "description": "Nowly Native Messaging Host",
  "path": "${INSTALL_DIR}/${BINARY_NAME}",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",
    "chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/"
  ]
}
MANIFEST_END
)

INSTALLED_COUNT=0
for dir in "${MANIFEST_DIRS[@]}"; do
  if [ -d "$dir" ] || [ -d "$(dirname "$dir")/$(basename "$(dirname "$dir")")" ]; then
    mkdir -p "$dir"
    echo "$MANIFEST" > "${dir}/${HOST_NAME}.json"
    echo "  Manifest installed: ${dir}/${HOST_NAME}.json"
    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
  fi
done

FIREFOX_MANIFEST=$(cat <<FIREFOX_END
{
  "name": "${HOST_NAME}",
  "description": "Nowly Native Messaging Host",
  "path": "${INSTALL_DIR}/${BINARY_NAME}",
  "type": "stdio",
  "allowed_extensions": [
    "${FIREFOX_EXT_ID_DEV}"
  ]
}
FIREFOX_END
)

mkdir -p "$FIREFOX_MANIFEST_DIR"
echo "$FIREFOX_MANIFEST" > "${FIREFOX_MANIFEST_DIR}/${HOST_NAME}.json"
echo "  Firefox manifest installed: ${FIREFOX_MANIFEST_DIR}/${HOST_NAME}.json"

echo ""
echo "Done! Binary installed at: ${INSTALL_DIR}/${BINARY_NAME}"
echo "Manifests written to ${INSTALLED_COUNT} Chromium-based browser(s) + Firefox."
echo ""
echo "To uninstall, run: ./scripts/uninstall-macos.sh"
