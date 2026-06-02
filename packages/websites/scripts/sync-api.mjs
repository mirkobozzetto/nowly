import { readFileSync, readdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..", "..", "..")
const SRC = join(__dirname, "..", "src")
const API_BASE = process.env.API_URL ?? "https://api.nowly.me"
const API_KEY = process.env.API_SECRET_KEY

if (!API_KEY) {
  console.error("API_SECRET_KEY is required")
  process.exit(1)
}

const getPresences = () => {
  return readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[A-Z]$/.test(d.name))
    .flatMap((letterDir) =>
      readdirSync(join(SRC, letterDir.name), { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(SRC, letterDir.name, d.name, "metadata.json")))
        .map((d) => {
          const dir = join(SRC, letterDir.name, d.name)
          const meta = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf-8"))
          return {
            slug: d.name.toLowerCase().replace(/\s+/g, "-"),
            dir,
            name: meta.name || d.name,
            author: meta.author?.name || "unknown",
            authorGithub: meta.author?.github || undefined,
            description: meta.description?.["en-US"] || Object.values(meta.description ?? {})[0] || "",
            descriptions: meta.description || undefined,
          }
        }),
    )
}

const checkExists = async (slug) => {
  try {
    const res = await fetch(`${API_BASE}/presences/${slug}`)
    return res.ok
  } catch {
    return false
  }
}

const main = async () => {
  const args = process.argv.slice(2)
  const forceNew = args.includes("--new")
  const cliAuthor = args.find((a) => a.startsWith("--author="))?.replace(/^--author=/, "")
  const cliGithub = args.find((a) => a.startsWith("--github="))?.replace(/^--github=/, "")
  const cliPr = args.find((a) => a.startsWith("--pr="))?.replace(/^--pr=/, "")
  const cliTitle = args.find((a) => a.startsWith("--title="))?.replace(/^--title=/, "")
  const cliSlug = args.find((a) => a.startsWith("--slug="))?.replace(/^--slug=/, "")

  let presences = getPresences()
  if (cliSlug) {
    presences = presences.filter((p) => p.slug === cliSlug)
    if (!presences.length) {
      console.error(`No presence found with slug: "${cliSlug}"`)
      process.exit(1)
    }
  }
  console.log(`Found ${presences.length} presences\n`)

  const payload = []

  for (const p of presences) {
    const exists = forceNew ? false : await checkExists(p.slug)
    const type = exists ? "modified" : "new"
    console.log(`  ${type === "new" ? "➕" : "🔄"} ${p.name} (${p.slug})${forceNew ? " (forced new)" : ""}`)
    payload.push({
      slug: p.slug,
      type,
      name: p.name,
      author: cliAuthor || p.author,
      authorGithub: cliGithub || p.authorGithub,
      description: p.description,
      descriptions: p.descriptions,
    })
  }

  if (!payload.length) {
    console.log("\nNo presences to sync")
    return
  }

  console.log(`\nSending ${payload.length} presences to API...`)

  const res = await fetch(`${API_BASE}/presences/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      presences: payload,
      ...(cliPr ? { pr: cliPr } : {}),
      ...(cliTitle ? { prTitle: cliTitle } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`API error (${res.status}): ${text}`)
    process.exit(1)
  }

  const data = await res.json()
  for (const r of data.results || []) {
    console.log(`  ✅ ${r.slug} → v${r.version}: ${r.changelog}`)
  }

  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
