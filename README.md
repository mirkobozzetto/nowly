<div align="center">

<img src="apps/web/public/app_title_white.png" height="94" alt="Nowly" />

Open-source Discord Rich Presence for the modern web.

Automatically display what you're watching, listening to, reading, or doing on Discord through a browser extension and a lightweight native host.

[Features](#features) -
[Architecture](#architecture) - 
[Development](#development) -
[Contributing](#contributing)

</div>

---

## What is Nowly?

Nowly is an open-source alternative to PreMiD.

It detects activity directly from supported websites, transforms it into a standardized presence format, and sends it to Discord through a local native host.

The project is built around three independent layers:

- Browser extension
- Native host (Local process)
- Presence registry

This separation keeps the system maintainable, scalable, and easy to contribute to.

---

## Features

- Open-source
- Discord Rich Presence
- Chrome and __Firefox*__ support
- Native Discord IPC integration
- Presence marketplace and registry
- Type-safe presence SDK
- Automated presence validation
- Asset management and image proxying
- Public API
- Modern monorepo architecture

*__\* Firefox__ support is experimental and may not work as expected. The extension is currently only available on the Chrome Web Store.*

---

## How It Works

```txt
┌──────────────────┐
│ YouTube, Twitch  │
│ Disney+, Netflix │
│ ...              │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Browser         │
│ Extension       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Native Host     │
│ (Local Process) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Discord Desktop │
└─────────────────┘
```

The extension detects activity from websites.

Website-specific presence scripts generate standardized activity payloads which are sent to a local native host. The native host communicates with Discord through IPC and updates the user's Rich Presence.

**No activity data is sent to any external server.** The extension and native host run entirely on the user's machine.

---

## Architecture

```txt
                            nowly monorepo

  packages/websites                 apps/api                  apps/web
  presence sources                  registry, assets,         public site,
  metadata, assets, CLI             ratings, auth, status     docs, library
          |                              |                         |
          | pnpm presence build          | serves data             | reads API
          v                              v                         v
  +-------------------+         +-------------------+      +-------------------+
  | built presences   |         | api.nowly.me      |      | nowly.me          |
  +---------+---------+         +---------+---------+      +-------------------+
            |
            v
  +-------------------+      native messaging      +-------------------+
  | apps/extension    | -------------------------> | apps/native       |
  | MV3 + side panel  |                            | Go host           |
  +---------+---------+ <------------------------- +---------+---------+
            |                                                |
            v                                                v
  +-------------------+                            +-------------------+
  | target websites   |                            | Discord Desktop   |
  +-------------------+                            +-------------------+
```

---

## Repository Structure

```txt
.
├── apps
│   ├── api
│   ├── extension
│   ├── native
│   └── web
│
├── packages
│   ├── env
│   ├── internal-cli
│   ├── locales
│   ├── presence
│   ├── shared
│   └── websites
│
└── .github
```

| Package | Description |
|----------|-------------|
| `apps/api` | Fastify API, registry, assets, ratings, status |
| `apps/extension` | Browser extension runtime |
| `apps/native` | Native Discord bridge written in Go |
| `apps/web` | Website, documentation, library |
| `packages/presence` | Presence SDK and runtime types |
| `packages/shared` | Shared schemas and utilities |
| `packages/websites` | Presence registry and build system |

---

## Requirements

- Node.js 22+
- pnpm 10+
- Go 1.23+
- Discord Desktop
- PostgreSQL (API development)

---

## Installation

```bash
pnpm install
```

Environment variables are fully typed through `@nowly/env`.

---

## Development

### Website

```bash
pnpm dev:web
```

### API

```bash
pnpm prisma:generate
pnpm dev:api
```

### Presences

```bash
pnpm presence:build
```

### Extension

```bash
pnpm build:extension:dev
```

Load:

```txt
for Chrome: chrome://extensions
for Firefox: about:debugging
```

Then import:

```txt
apps/extension/dist/[chrome|firefox]
```

## Native Host

The native host is responsible for communicating with Discord through IPC and receiving activity updates from the browser extension.

```bash
cd apps/native
make build
```

> [!NOTE]
> Unless you're developing the native host itself, you do not need separate host installations for development and production builds.
>
> The host downloaded from `https://nowly.me/host` works with Chrome development builds, Chrome production builds, Firefox development builds, and future Firefox production builds.
>
> Native messaging authorization is based on the browser extension ID. When developing the extension, keep a fixed extension key so the generated extension ID remains stable. If the extension ID changes, the native host will reject requests because the ID no longer matches the registered allowed extensions.

---

## Creating a Presence

Create a new presence:

```bash
pnpm presence init "Website Name"
```

Build:

```bash
pnpm presence build website-slug
```

Validate:

```bash
pnpm presence validate
```

Example structure:

```txt
packages/websites/src/Y/YouTube/
├── metadata.json
├── presence.ts
└── assets
    ├── icon.png
    ├── logo.png
    └── thumbnail.jpg
```

---

## Useful Commands

```bash
pnpm dev:web
pnpm dev:api

pnpm build:extension
pnpm build:extension:dev

pnpm presence
pnpm presence:build
pnpm presence:validate

pnpm typecheck
pnpm lint
```

---

## Contributing

Contributions are welcome.

Before opening a pull request, run the checks related to the layer you modified:

```bash
pnpm lint
pnpm typecheck
```

Extension:

```bash
pnpm --filter @nowly/extension lint
```

API:

```bash
pnpm --filter @nowly/api test
```

Presences:

```bash
pnpm presence validate
```

Native host:

```bash
cd apps/native
go test ./...
```

---

## License

MIT