import { readFileSync, writeFileSync, readdirSync, existsSync, cpSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import * as esbuild from "esbuild"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, "..", "src")
const DIST = join(__dirname, "..", "dist")
const PRESENCE_SDK = join(__dirname, "..", "..", "presence", "src", "index.ts")

const nowlyPresencePlugin = {
  name: "nowly-presence",
  setup(build) {
    build.onResolve({ filter: /^@nowly\/presence$/ }, () => ({
      path: PRESENCE_SDK,
    }))
  },
}

function extractSettings(source) {
  const fnMatch = source.match(/(?:new\s+)?Presence\.Settings\s*\(/)
  if (!fnMatch) return null

  const startParen = fnMatch.index + fnMatch[0].length
  let depth = 1
  let i = startParen
  let inStr = false
  let quote = null
  let isEsc = false

  while (i < source.length && depth > 0) {
    const c = source[i]
    if (isEsc) {
      isEsc = false
    } else if (inStr) {
      if (c === "\\") isEsc = true
      else if (c === quote) inStr = false
    } else {
      if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c }
      else if (c === "(") depth++
      else if (c === ")") depth--
    }
    i++
  }

  if (depth !== 0) return null
  const objStr = source.slice(startParen, i - 1)

  try {
    return new Function(`return (${objStr})`)()
  } catch (e) {
    console.warn(`  Failed to evaluate settings: ${e.message}`)
    return null
  }
}

async function build() {
  mkdirSync(join(DIST, "presences"), { recursive: true })

  const presences = readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((letterDir) => {
      const letterPath = join(SRC, letterDir.name)
      return readdirSync(letterPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((presenceDir) => ({
          letter: letterDir.name,
          slug: presenceDir.name.toLowerCase().replace(/\s+/g, "-"),
          path: join(letterPath, presenceDir.name),
        }))
    })

  const registry = []

  for (const presence of presences) {
    const metadataPath = join(presence.path, "metadata.json")
    const presenceTsPath = join(presence.path, "presence.ts")
    const assetsDir = join(presence.path, "assets")
    const distPresenceDir = join(DIST, "presences", presence.slug)

    if (!existsSync(metadataPath)) {
      console.warn(`Skipping ${presence.slug}: no metadata.json`)
      continue
    }

    const metadata = JSON.parse(readFileSync(metadataPath, "utf-8"))
    metadata.slug = presence.slug
    registry.push(metadata)

    mkdirSync(distPresenceDir, { recursive: true })

    // Build presence.ts bundle
    if (existsSync(presenceTsPath)) {
      const result = await esbuild.build({
        entryPoints: [presenceTsPath],
        bundle: true,
        format: "iife",
        globalName: "__PRESENCE__",
        outfile: join(distPresenceDir, "bundle.js"),
        minify: false,
        target: "es2022",
        platform: "browser",
        plugins: [nowlyPresencePlugin],
      })

      if (result.errors.length > 0) {
        console.error(`Error building ${presence.slug}:`, result.errors)
        continue
      }

      console.log(`\u2713 Built ${presence.slug}`)

      // Extract and write settings
      const source = readFileSync(presenceTsPath, "utf-8")
      const settings = extractSettings(source)
      if (settings) {
        writeFileSync(join(distPresenceDir, "settings.json"), JSON.stringify(settings, null, 2))
        metadata.settings = settings
        console.log(`  Settings extracted for ${presence.slug}`)
      }
    }

    // Copy assets
    if (existsSync(assetsDir)) {
      const distAssetsDir = join(distPresenceDir, "assets")
      mkdirSync(distAssetsDir, { recursive: true })
      cpSync(assetsDir, distAssetsDir, { recursive: true })
      console.log(`  Assets copied for ${presence.slug}`)
    }
  }

  // Write registry
  writeFileSync(join(DIST, "registry.json"), JSON.stringify(registry, null, 2))
  console.log(`\n\u2713 Registry written (${registry.length} presences)`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
