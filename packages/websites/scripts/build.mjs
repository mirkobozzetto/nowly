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

      console.log(`✓ Built ${presence.slug}`)
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
  console.log(`\n✓ Registry written (${registry.length} presences)`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
