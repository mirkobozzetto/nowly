# Nowly CLI

Interactive CLI to create, build, and push Nowly presences.

## Usage

### Interactive mode

```bash
pnpm presence
```

### Commands

```bash
# Create a new presence
pnpm presence init "Netflix"

# Build all presences
pnpm presence build

# Build a specific presence
pnpm presence build youtube

# Push a presence (build + API)
pnpm presence push youtube

# Pick which presences to push
pnpm presence push

# Push all presences
pnpm presence push --all

# List presences with their API version
pnpm presence list

# Validate metadata
pnpm presence validate
```

### Root scripts (from monorepo root)

```bash
# Same as `pnpm presence build`
pnpm presence:build

# Remove all built presence dist files
pnpm presence:clean

# Clean + rebuild all presences
pnpm presence:rebuild
```

### Push options

```bash
# Specify version
pnpm presence push youtube --version 1.1.0

# Auto patch (1.0.0 -> 1.0.1)
pnpm presence push youtube --patch

# Auto minor (1.0.0 -> 1.1.0)
pnpm presence push youtube --minor

# Changelog message
pnpm presence push youtube --patch --changelog "Fix player detection"

# Non-interactive batch push
pnpm presence push --all --patch --changelog "Batch update"
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `API_URL` | `https://api.nowly.me` | API base URL |
| `API_SECRET_KEY` | — | API authentication key |

## Presence structure

```
src/Y/YouTube/
├── metadata.json    # Name, urls, category, description… (version is backend-managed)
├── presence.ts      # Presence logic
└── assets/
    ├── logo.png
    ├── icon.png
    └── thumbnail.jpg
```

### Notes

- The `version` field in `metadata.json` is **not required** — versions are managed by the backend when pushing.
- For dev builds, use `pnpm presence build <slug>` to build only the presence you need, then `pnpm build:extension:dev` to bundle it into the extension.
