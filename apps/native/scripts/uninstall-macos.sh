#!/usr/bin/env bash
set -euo pipefail

HOST_NAME="nowly.client"
BINARY_NAME="nowly-host"
INSTALL_DIR="${HOME}/Library/Application Support/NowlyClient"
MANIFEST_DIRS=(
  "${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "${HOME}/Library/Application Support/Chromium/NativeMessagingHosts"
  "${HOME}/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "${HOME}/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
  "${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts"
)

echo "Uninstalling Nowly Native Host..."

# Remove manifests
for dir in "${MANIFEST_DIRS[@]}"; do
  manifest="${dir}/${HOST_NAME}.json"
  if [ -f "$manifest" ]; then
    rm -f "$manifest"
    echo "  Removed manifest: $manifest"
  fi
done

# Remove binary
if [ -f "${INSTALL_DIR}/${BINARY_NAME}" ]; then
  rm -f "${INSTALL_DIR}/${BINARY_NAME}"
  echo "  Removed binary: ${INSTALL_DIR}/${BINARY_NAME}"
fi

# Remove install dir if empty
rmdir "$INSTALL_DIR" 2>/dev/null || true

echo "Done!"
