import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import esbuild from "esbuild"
import { DIST, PRESENCE_SDK, type PresenceMeta } from "./discover.js"

const nowlyPresencePlugin = {
  name: "nowly-presence",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@nowly\/presence$/ }, () => ({
      path: PRESENCE_SDK,
    }))
  },
}

export async function buildPresence(p: PresenceMeta): Promise<string | null> {
  const presenceTsPath = join(p.dir, "presence.ts")
  if (!existsSync(presenceTsPath)) {
    return null
  }

  const distDir = join(DIST, "presences", p.slug)
  mkdirSync(distDir, { recursive: true })

  const bundlePath = join(distDir, "bundle.js")

  const result = await esbuild.build({
    entryPoints: [presenceTsPath],
    bundle: true,
    format: "iife",
    globalName: "__PRESENCE__",
    outfile: bundlePath,
    minify: false,
    target: "es2022",
    platform: "browser",
    plugins: [nowlyPresencePlugin],
    write: true,
  })

  if (result.errors.length > 0) {
    return null
  }

  const bundle = readFileSync(bundlePath, "utf-8")

  const source = readFileSync(presenceTsPath, "utf-8")
  const settings = extractSettings(source)
  if (settings) {
    writeFileSync(join(distDir, "settings.json"), JSON.stringify(settings, null, 2))
  }

  const assetsDir = join(p.dir, "assets")
  if (existsSync(assetsDir)) {
    const distAssets = join(distDir, "assets")
    mkdirSync(distAssets, { recursive: true })
    cpSync(assetsDir, distAssets, { recursive: true })
  }

  return bundle
}

export async function buildAllPresences(presences: PresenceMeta[]): Promise<void> {
  mkdirSync(join(DIST, "presences"), { recursive: true })
  const registry: any[] = []

  for (const p of presences) {
    const bundle = await buildPresence(p)
    if (bundle) {
      const settings = extractSettingsFromFile(p.dir)
      registry.push({ ...p.metadata, slug: p.slug, settings })
    }
  }

  writeFileSync(join(DIST, "registry.json"), JSON.stringify(registry, null, 2))
}

function extractSettingsFromFile(dir: string): any | null {
  const tsPath = join(dir, "presence.ts")
  if (!existsSync(tsPath)) return null
  const source = readFileSync(tsPath, "utf-8")
  return extractSettings(source)
}

function extractSettings(source: string): any | null {
  const fnMatch = source.match(/(?:new\s+)?Presence\.Settings\s*\(/)
  if (!fnMatch) return null

  const startParen = fnMatch.index! + fnMatch[0].length
  let depth = 1
  let i = startParen
  let inStr = false
  let quote: string | null = null
  let isEsc = false

  while (i < source.length && depth > 0) {
    const c = source[i]

    if (isEsc) {
      isEsc = false
    } else if (inStr) {
      if (c === "\\") isEsc = true
      else if (c === quote) inStr = false
    } else {
      if (c === "\"" || c === "'" || c === "`") {
        inStr = true
        quote = c
      } else if (c === "(") {
        depth++
      } else if (c === ")") {
        depth--
      }
    }

    i++
  }

  if (depth !== 0) return null

  const objStr = source.slice(startParen, i - 1)

  try {
    const fn = new Function(`return (${objStr})`)
    return fn()
  } catch {
    return null
  }
}
