import { execSync } from "child_process"
import { existsSync, readFileSync, readdirSync } from "fs"
import { dirname, join, relative } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..", "..", "..")
const SRC = join(__dirname, "..", "src")
const API_BASE = process.env.API_URL ?? "https://api.nowly.me"
let cliChangelog = ""

let API_KEY = process.env.API_SECRET_KEY
if (!API_KEY) {
  try {
    const envPath = join(ROOT, "apps", "web", ".env.local")
    const envContent = readFileSync(envPath, "utf-8")
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.startsWith("API_SECRET_KEY=")) {
        API_KEY = trimmed.replace(/^API_SECRET_KEY=/, "").replace(/^["']|["']$/g, "")
        break
      }
    }
  } catch {
    // .env.local not found, proceed without key
  }
}

const headers = { "Content-Type": "application/json" }
if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`

function gitHasChanges(dir) {
  const rel = relative(ROOT, dir)
  try {
    const out = execSync(`git status --porcelain -- "${rel}"`, { encoding: "utf-8", cwd: ROOT }).trim()
    return out.length > 0
  } catch {
    return true
  }
}

function getPresences() {
  return readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[A-Z]$/.test(d.name))
    .flatMap((letterDir) =>
      readdirSync(join(SRC, letterDir.name), { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(SRC, letterDir.name, d.name, "metadata.json")))
        .map((d) => ({
          slug: d.name.toLowerCase().replace(/\s+/g, "-"),
          letter: letterDir.name,
          dirName: d.name,
        })),
    )
}

function bumpVersion(current) {
  const parts = current.split(".").map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join(".")
}

async function callApi(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`  API error (${res.status}): ${text}`)
    return { ok: false }
  }
  return { ok: true }
}

function getGitAuthor(dir) {
  try {
    return execSync('git log -1 --format="%an"', { encoding: "utf-8", cwd: dir }).trim()
  } catch {
    return "unknown"
  }
}

function getMetadataGithub(dir) {
  try {
    const meta = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf-8"))
    return meta.author?.github || undefined
  } catch {
    return undefined
  }
}

async function processPresence(slug, name, forceNew, opts = {}) {
  console.log(`\nProcessing ${name} (${slug})...`)

  if (!forceNew && opts.dir) {
    if (!gitHasChanges(opts.dir)) {
      console.log("  No changes detected, skipping")
      return
    }
  }

  const infoRes = await fetch(`${API_BASE}/presences/${slug}`)
  if (!infoRes.ok) {
    console.warn(`  Presence not found on API, treating as new`)
  }

  let currentVersion = null
  try {
    const data = await infoRes.json()
    currentVersion = data.version ?? null
  } catch {
    // treat as new
  }

  const isNew = forceNew || !currentVersion

  const authorGithub = opts.dir ? getMetadataGithub(opts.dir) : undefined

  if (isNew) {
    console.log("  New presence - setting addedAt + initial version")
    await callApi("PUT", `/presences/${slug}`, {
      added: new Date().toISOString().split("T")[0],
      version: "1.0.0",
      changelog: "Initial release",
      author: opts.dir ? getGitAuthor(opts.dir) : "unknown",
      authorGithub,
    })

    console.log("  Version set to 1.0.0")
    return
  }

  const nextVersion = bumpVersion(currentVersion)
  const author = opts.dir ? getGitAuthor(opts.dir) : "unknown"
  console.log(`  Modified presence - bumping ${currentVersion} -> ${nextVersion}`)
  await callApi("PUT", `/presences/${slug}`, {
    updated: new Date().toISOString().split("T")[0],
    version: nextVersion,
    changelog: cliChangelog,
    author,
    authorGithub,
  })

  console.log(`  Version bumped to ${nextVersion}`)
}

async function main() {
  const args = process.argv.slice(2)
  const forceNew = args.includes("--new")
  const changelogArg = args.find((a) => a.startsWith("--changelog="))
  cliChangelog = changelogArg ? changelogArg.replace(/^--changelog=/, "") : ""

  const presences = getPresences()

  if (args.length === 0 || args[0].startsWith("--")) {
    // bulk mode: only process presences with uncommitted changes
    for (const p of presences) {
      const dir = join(SRC, p.letter, p.dirName)
      await processPresence(p.slug, p.slug, forceNew, { dir })
    }
  } else {
    // explicit slugs: always process (no git skip)
    for (const arg of args) {
      if (arg.startsWith("--")) continue
      const p = presences.find((pr) => pr.slug === arg)
      if (p) {
        await processPresence(p.slug, p.slug, forceNew)
      } else {
        console.warn(`Presence "${arg}" not found in filesystem, treating as new`)
        await processPresence(arg, arg, true)
      }
    }
  }

  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
