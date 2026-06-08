# Nowly Native Host

Chromium Native Messaging host for Discord Rich Presence integration.

## Contract

| Field | Value |
|-------|-------|
| Host name | `nowly.client` |
| Extension ID (dev) | `abbegmindbabanjcabnmcjmamaoffbam` |
| Extension ID (prod) | *(set when published to Chrome Web Store)* |
| Binary | `nowly-host` (Unix) / `nowly-host.exe` (Windows) |
| Log dir | `~/.cache/NowlyClient/` (Unix) / `%LOCALAPPDATA%\NowlyClient\` (Windows) |

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
- [Inno Setup 6+](https://jrsoftware.org/isdl.php) *(Windows installer only)*

### Build all platforms

```bash
make build
```

### Platform-specific builds

#### Windows

```powershell
go build -o dist/nowly-host.exe ./cmd/host
```

#### Linux

```bash
make build/linux
# or manually:
GOOS=linux GOARCH=amd64 go build -o dist/nowly-host-linux ./cmd/host
```

#### macOS (Intel)

```bash
make build/darwin
# or manually:
GOOS=darwin GOARCH=amd64 go build -o dist/nowly-host-darwin ./cmd/host
```

#### macOS (Apple Silicon)

```bash
make build/darwin-arm
# or manually:
GOOS=darwin GOARCH=arm64 go build -o dist/nowly-host-darwin-arm64 ./cmd/host
```

### Output

| Platform | Binary |
|----------|--------|
| Windows  | `dist/nowly-host.exe` |
| Linux    | `dist/nowly-host-linux` |
| macOS Intel | `dist/nowly-host-darwin` |
| macOS ARM | `dist/nowly-host-darwin-arm64` |

### CDN Artifacts

| Platform | Min. version | File | Size | Contents |
|----------|-------------|------|------|----------|
| Windows  | Windows 10 x64 | `NowlySetup.exe` | ~3.7 MB | Inno Setup installer (double-click to install) |
| Windows  | Windows 10 x64 | `nowly-windows.zip` | ~3.3 MB | Same `.exe` in a zip |
| Linux    | Linux 2.6.32+ / glibc 2.17+ | `nowly-linux.tar.gz` | ~1.9 MB | `nowly-host-linux` binary + install/uninstall scripts |
| macOS    | macOS 11 Big Sur+ | `nowly-macos.tar.gz` | ~3.7 MB | Intel + ARM binaries + install/uninstall scripts |

## Install

### Windows — Inno Setup installer

```powershell
iscc installer.iss
```

The installer registers the host with Chrome, Edge, and Brave via registry keys.

Override the extension ID for production:

```powershell
iscc installer.iss /DEXTENSION_ID=your-store-id-here
```

### Linux

```bash
# 1. Build
make build/linux

# 2. Install (copies binary + generates manifests for Chrome, Chromium, Brave, Edge, Vivaldi, Opera)
./scripts/install-linux.sh

# 3. Uninstall
./scripts/uninstall-linux.sh
```

### macOS

```bash
# 1. Build (Intel)
make build/darwin
# or (Apple Silicon)
make build/darwin-arm

# 2. Install (copies binary + generates manifests for Chrome, Chromium, Brave, Edge)
./scripts/install-macos.sh

# 3. Uninstall
./scripts/uninstall-macos.sh
```

The install scripts place the binary in `~/.local/share/NowlyClient/` (Linux) or `~/Library/Application Support/NowlyClient/` (macOS) and write the native messaging manifest to each browser's config directory.

Override the extension ID:

```bash
EXTENSION_ID=your-store-id-here ./scripts/install-linux.sh
EXTENSION_ID=your-store-id-here ./scripts/install-macos.sh
```

**Note:** The native messaging manifest points to the binary's absolute path. If you move the binary after installation, re-run the install script or update the manifest.

## Assets

| File | Source | Format |
|------|--------|--------|
| `installer.ico` | Generated from `assets/icon.png` | ICO 48×48 |
| `assets/banner.png` | Wizard banner (left panel) | PNG 202×386 |
| `assets/icon.png` | Wizard small logo | PNG 55×55 |

To regenerate `installer.ico` from the icon PNG:

```powershell
ffmpeg -y -i assets/icon.png -vf "scale=48:48" installer.ico
```