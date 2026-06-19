# Nowly

Nowly is an open-source Discord Rich Presence app for the web. It combines a browser extension, a native Discord host, and installable presences for supported websites.

## Workspace

- `apps/extension` - browser extension UI and runtime.
- `apps/native` - native messaging host that talks to Discord.
- `apps/web` - website, documentation, library, and status pages.
- `apps/api` - API used by the website, registry, ratings, analytics, and image proxy.
- `packages/websites` - presence source files, metadata, assets, and CLI tooling.

## Common Commands

```bash
pnpm dev:web
pnpm dev:api
pnpm build:extension
pnpm presence:build
```

## Contributing

Presence development uses the Nowly CLI:

```bash
pnpm presence
```

See `packages/websites/cli/README.md` for CLI usage and `apps/native/README.md` for native host build details.

## Supporters

Nowly is free and always will be. If you want to support the project, you can do it on [Ko-fi](https://ko-fi.com/qkimi_).

<!-- supporters:start -->
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AnastasisArt">
        <img src="https://github.com/AnastasisArt.png?size=96" width="64" height="64" alt="AnastasisArt" />
        <br />
        <sub><b>AnastasisArt</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/mo-gd">
        <img src="https://github.com/mo-gd.png?size=96" width="64" height="64" alt="mo-gd" />
        <br />
        <sub><b>mo-gd</b></sub>
      </a>
    </td>
    <td align="center">
      <img src="https://ko-fi.com/img/anon9.png?v=11" width="64" height="64" alt="Topinambour" />
      <br />
      <sub><b>Topinambour</b></sub>
    </td>
    <td align="center">
      <a href="https://github.com/Galadou">
        <img src="https://github.com/Galadou.png?size=96" width="64" height="64" alt="Galadou" />
        <br />
        <sub><b>Galadou</b></sub>
      </a>
    </td>
  </tr>
</table>
<!-- supporters:end -->

Thank you to all of our supporters 💕
