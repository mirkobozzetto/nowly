# @nowly/env

Typed environment access for the Nowly monorepo.

## Exports

| Export | Surface | Notes |
| --- | --- | --- |
| `@nowly/env/server` | API server only | Contains secrets and throws when required values are missing. |
| `@nowly/env/client` | Next.js app | Public web values and server-side web fetch config. |
| `@nowly/env/extension` | Browser extension | Public Vite values only. |
| `@nowly/env/cli` | Presence CLI | API and R2 publishing config. |

## Variables

| Variable | Export | Required | Default |
| --- | --- | --- | --- |
| `PORT` | `serverEnv` | No | `3001` |
| `FRONTEND_URL` | `serverEnv` | No | `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` | `serverEnv` | Yes | - |
| `UPSTASH_REDIS_REST_TOKEN` | `serverEnv` | Yes | - |
| `JWT_SECRET` | `serverEnv` | Yes | - |
| `ANONYMOUS_HASH_SECRET` | `serverEnv` | Yes | - |
| `DISCORD_CLIENT_ID` | `serverEnv` | Yes | - |
| `DISCORD_CLIENT_SECRET` | `serverEnv` | Yes | - |
| `DISCORD_REDIRECT_URI` | `serverEnv` | Yes | - |
| `PRESENCE_SIGNING_PRIVATE_KEY` | `serverEnv` | Yes | - |
| `API_SECRET_KEY` | `serverEnv`, `clientEnv`, `cliEnv` | Contextual | - |
| `OPENAI_API_KEY` | `serverEnv` | No | fallback changelogs |
| `NEXT_PUBLIC_API_BASE_URL` | `clientEnv` | No | `https://api.nowly.me` |
| `NEXT_PUBLIC_BASE_URL` | `clientEnv` | No | `http://localhost:3000` |
| `PRESENCE_API_URL` | `clientEnv` | No | `https://api.nowly.me` |
| `VITE_WEB_BASE_URL` | `extensionEnv` | No | `https://nowly.me` |
| `VITE_API_BASE_URL` | `extensionEnv` | No | `https://api.nowly.me` |
| `VITE_CDN_BASE_URL` | `extensionEnv` | No | `https://cdn.nowly.me` |
| `API_URL` | `cliEnv` | No | `https://api.nowly.me` |
| `R2_BUCKET` | `cliEnv` | No | `nowly` |
| `R2_ACCESS_KEY_ID` | `cliEnv` | For R2 sync | - |
| `R2_SECRET_ACCESS_KEY` | `cliEnv` | For R2 sync | - |
| `R2_ACCOUNT_ID` | `cliEnv` | For R2 sync | - |
