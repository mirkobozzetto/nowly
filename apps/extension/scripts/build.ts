import react from "@vitejs/plugin-react"
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"
import { build } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const DIST = join(ROOT, "dist")

const webBaseUrl = process.env.VITE_WEB_BASE_URL ?? "https://nowly.me"
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? "https://api.nowly.me"
const cdnBaseUrl = process.env.VITE_CDN_BASE_URL ?? "https://cdn.nowly.me"

const define = {
  "import.meta.env.VITE_WEB_BASE_URL": JSON.stringify(webBaseUrl),
  "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
  "import.meta.env.VITE_CDN_BASE_URL": JSON.stringify(cdnBaseUrl),
}

rmSync(DIST, { recursive: true, force: true })
mkdirSync(DIST, { recursive: true })

const buildPage = async (name: string) => {
  await build({
    root: join(ROOT, "src", name),
    base: "./",
    plugins: [react()],
    define,
    resolve: {
      alias: {
        "@": resolve(ROOT, "src"),
        "@messages": resolve(ROOT, "messages"),
      },
    },
    build: {
      outDir: join(DIST, name),
      emptyOutDir: true,
      rollupOptions: {
        input: join(ROOT, "src", name, "index.html"),
      },
    },
    configFile: false,
  })
}

const buildScript = async (name: string, entry: string) => {
  await build({
    root: ROOT,
    define,
    resolve: {
      alias: {
        "@": resolve(ROOT, "src"),
        "@messages": resolve(ROOT, "messages"),
      },
    },
    build: {
      outDir: DIST,
      emptyOutDir: false,
      lib: {
        entry,
        formats: ["iife"] as const,
        name: `__presences_${name}`,
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        external: [],
      },
    },
    configFile: false,
  })
}

const copyManifest = () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf-8"))
  manifest.background.service_worker = "background.js"
  delete manifest.background.type
  manifest.content_scripts[0].js = ["content.js"]
  manifest.action.default_popup = "popup/index.html"
  delete manifest.action.default_popup
  manifest.side_panel.default_path = "sidepanel/index.html"
  manifest.icons = {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  }
  manifest.action.default_icon = { ...manifest.icons }
  writeFileSync(join(DIST, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
}

const copyStatic = () => {
  mkdirSync(join(DIST, "icons"), { recursive: true })
  for (const size of [16, 48, 128]) {
    copyFileSync(
      join(ROOT, "src", "icons", `icon${size}.png`),
      join(DIST, "icons", `icon${size}.png`),
    )
  }
  copyFileSync(join(ROOT, "..", "web", "public", "app_title_white.png"), join(DIST, "app_title_white.png"))
  cpSync(join(ROOT, "_locales"), join(DIST, "_locales"), { recursive: true })
}

await buildPage("popup")
await buildPage("sidepanel")
await buildScript("background", join(ROOT, "src", "background", "index.ts"))
await buildScript("content", join(ROOT, "src", "content", "index.ts"))
copyManifest()
copyStatic()
