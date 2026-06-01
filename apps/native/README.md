# Presences Native Host

This folder is the source of truth for Chromium Native Messaging and Discord RPC.

## Contract

Host name: `nowly.client`

Installation folder: `%LOCALAPPDATA%\NowlyClient`

Supported messages:

- `PING`
- `SET_ACTIVITY`
- `CLEAR_ACTIVITY`

## Build

```powershell
go build -o dist/nowly-host.exe ./cmd/host
go build -o dist/nowly-installer.exe ./cmd/installer
go build -o dist/nowly-uninstaller.exe ./cmd/uninstaller
```

Place `nowly-host.exe` next to `nowly-installer.exe` before running the installer.