# Nowly Native Host

Chromium Native Messaging host for Discord Rich Presence integration.

## Contract

| Field | Value |
|-------|-------|
| Host name | `nowly.client` |
| Extension ID (dev) | `abbegmindbabanjcabnmcjmamaoffbam` |
| Extension ID (prod) | *(set when published to Chrome Web Store)* |
| Install folder | `%LOCALAPPDATA%\NowlyClient` |

### Supported messages

| Type | Direction | Payload |
|------|-----------|---------|
| `PING` | Extension → Host | — |
| `PONG` | Host → Extension | `connected`, `status`, `discordConnected`, `profile` |
| `CONNECTED` | Host → Extension | — |
| `SET_ACTIVITY` | Extension → Host | `PresencePayload` |
| `CLEAR_ACTIVITY` | Extension → Host | — |
| `OK` | Host → Extension | — |
| `ERROR` | Host → Extension | `error` string |

## Build

### Prerequisites

- [Go 1.21+](https://go.dev/dl/)
- [Inno Setup 6+](https://jrsoftware.org/isdl.php) (for the installer)

### 1. Build the binaries

```powershell
go build -o dist/nowly-host.exe ./cmd/host
go build -o dist/nowly-installer.exe ./cmd/installer
go build -o dist/nowly-uninstaller.exe ./cmd/uninstaller
```

### 2. Generate the installer

#### Development (default extension ID)

```powershell
iscc installer.iss
```

#### Production (Chrome Web Store ID)

```powershell
iscc installer.iss /DEXTENSION_ID=your-store-id-here
```

The Extension ID is embedded in the native messaging manifest so Chrome allows the extension to communicate with the host. The dev ID is the default; use `/D` to override for the published version.

### 3. Output

The installer is generated at `dist/NowlySetup.exe`.

## Icons

The installer icon (`installer.ico`) is generated from the extension icon. To regenerate:

```powershell
ffmpeg -y -i ../extension/src/icons/icon48.png -vf "scale=48:48" installer.ico
```