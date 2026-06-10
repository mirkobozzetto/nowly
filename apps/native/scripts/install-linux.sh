#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/../.env" ] && source "$SCRIPT_DIR/../.env"

HOST_NAME="nowly.client"
EXTENSION_ID="${EXTENSION_ID:-kmnlnfldimgneaopdihplkebobckcjpf}"
BINARY_NAME="nowly-host"
BINARY_SRC="${1:-dist/nowly-host-linux}"

INSTALL_DIR="${HOME}/.local/share/NowlyClient"
MANIFEST_DIRS=(
  "${HOME}/.config/google-chrome/NativeMessagingHosts"
  "${HOME}/.config/chromium/NativeMessagingHosts"
  "${HOME}/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "${HOME}/.config/microsoft-edge/NativeMessagingHosts"
  "${HOME}/.config/vivaldi/NativeMessagingHosts"
  "${HOME}/.config/opera/NativeMessagingHosts"
)

if [ ! -f "$BINARY_SRC" ]; then
  echo "Error: binary not found at $BINARY_SRC"
  echo "Usage: $0 [path-to-binary]"
  echo ""
  echo "  First build the binary:"
  echo "    make build/linux"
  echo "    # or"
  echo "    GOOS=linux GOARCH=amd64 go build -o dist/nowly-host-linux ./cmd/host"
  exit 1
fi

echo "Installing Nowly Native Host for Linux..."

mkdir -p "$INSTALL_DIR"
cp "$BINARY_SRC" "${INSTALL_DIR}/${BINARY_NAME}"
chmod 755 "${INSTALL_DIR}/${BINARY_NAME}"

MANIFEST=$(cat <<MANIFEST_END
{
  "name": "${HOST_NAME}",
  "description": "Nowly Native Messaging Host",
  "path": "${INSTALL_DIR}/${BINARY_NAME}",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://${EXTENSION_ID}/"]
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

echo ""
echo "Done! Binary installed at: ${INSTALL_DIR}/${BINARY_NAME}"
echo "Manifests written to ${INSTALLED_COUNT} browser(s)."
echo ""
echo "To uninstall, run: ./scripts/uninstall-linux.sh"
