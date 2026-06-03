#!/usr/bin/env node
import { Command } from "commander"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { SRC, getPresences, getPresenceBySlug, getSlugFromName, getLetterFromName } from "./discover.js"
import { buildPresence, buildAllPresences } from "./builder.js"
import { fetchPresenceInfo, pushPresences, bumpVersion, getLocalBundle } from "./api.js"
import { presenceTs, metadataJson } from "./templates/presence.js"
import { logger, spinner } from "./logger.js"
import { input, select, multiselect, confirm } from "./prompts.js"

const program = new Command()
  .name("presence")
  .description("Nowly presence manager — create, build, and push presences")
  .version("1.0.0")

// ── Init ──────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Create a new presence interactively")
  .argument("[name]", "Service name (e.g. Netflix)")
  .action(async (nameArg?: string) => {
    logger.newline()
    logger.title("✦ Create a new presence")

    const name = nameArg || (await input("Service name:", { validate: (v) => v.trim().length > 0 || "Name is required" }))
    const slug = getSlugFromName(name)
    const letter = getLetterFromName(name)
    const dir = join(SRC, letter, name)

    if (existsSync(dir)) {
      logger.error(`Presence "${name}" already exists at ${dir}`)
      process.exit(1)
    }

    const category = await select("Category:", [
      { name: "streaming", message: "Streaming" },
      { name: "music", message: "Music" },
      { name: "tv", message: "TV" },
      { name: "anime", message: "Anime" },
      { name: "other", message: "Other" },
    ])

    const color = await input("Brand color (hex):", { initial: "#555555" })
    const urlsInput = await input("URLs (comma-separated):")
    const urls = urlsInput.split(",").map((u: string) => u.trim()).filter(Boolean)
    const tagsInput = await input("Tags (comma-separated):")
    const tags = tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean)

    const author = await input("Author name:", { initial: "Nowly" })
    const github = await input("Author GitHub (optional):")

    const descriptionEn = await input("Description (en-US):", { validate: (v) => v.trim().length > 0 || "Description is required" })

    let descriptionFr: string | undefined
    const addFr = await confirm("Add French (fr-FR) description?", true)
    if (addFr) {
      descriptionFr = await input("Description (fr-FR):")
    }

    let descriptionEs: string | undefined
    const addEs = await confirm("Add Spanish (es-ES) description?", false)
    if (addEs) {
      descriptionEs = await input("Description (es-ES):")
    }

    spinner.start("Generating presence files...")

    mkdirSync(dir, { recursive: true })
    mkdirSync(join(dir, "assets"), { recursive: true })

    writeFileSync(join(dir, "metadata.json"), metadataJson({ name, author, github, category, color, urls, tags, descriptionEn, descriptionFr, descriptionEs }))
    writeFileSync(join(dir, "presence.ts"), presenceTs)

    spinner.succeed(`Presence "${name}" created at ${dir}`)
    logger.info(`Slug: ${slug}`)
    logger.info(`Next: run ${logger.muted ? "pnpm presence build" : "pnpm presence build"} to build it`)
  })

// ── Build ─────────────────────────────────────────────────────────────────
program
  .command("build")
  .description("Build presence bundles")
  .argument("[slug]", "Presence slug (optional — builds all if omitted)")
  .action(async (slug?: string) => {
    logger.newline()

    if (slug) {
      const p = getPresenceBySlug(slug)
      if (!p) {
        logger.error(`Presence "${slug}" not found`)
        process.exit(1)
      }

      spinner.start(`Building "${p.name}"...`)
      const bundle = await buildPresence(p)
      if (!bundle) {
        spinner.fail(`Build failed for "${slug}"`)
        process.exit(1)
      }
      spinner.succeed(`Built "${p.name}" (${(bundle.length / 1024).toFixed(1)} kB)`)
      return
    }

    const presences = getPresences()
    if (presences.length === 0) {
      logger.warning("No presences found")
      return
    }

    logger.title(`Building ${presences.length} presences...`)
    let ok = 0
    let fail = 0

    for (const p of presences) {
      spinner.start(`Building "${p.name}"...`)
      const bundle = await buildPresence(p)
      if (bundle) {
        spinner.succeed(`Built "${p.name}" (${(bundle.length / 1024).toFixed(1)} kB)`)
        ok++
      } else {
        spinner.fail(`Build failed for "${p.name}"`)
        fail++
      }
    }

    logger.newline()
    logger.success(`${ok} built, ${fail} failed`)
  })

// ── Push ──────────────────────────────────────────────────────────────────
program
  .command("push")
  .description("Build and push presence(s) to API")
  .argument("[slug]", "Presence slug (optional — prompts selection if omitted)")
  .option("-a, --all", "Push all presences (non-interactive)")
  .option("-v, --version <version>", "Explicit version string (skip bump prompt)")
  .option("--patch", "Auto bump patch version")
  .option("--minor", "Auto bump minor version")
  .option("--changelog <text>", "Changelog message")
  .action(async (slug?: string, options?: { all?: boolean; version?: string; patch?: boolean; minor?: boolean; changelog?: string }) => {
    const opts = options || {} as any
    logger.newline()

    let presences = getPresences()
    if (presences.length === 0) {
      logger.warning("No presences found")
      return
    }

    let selected = presences

    if (slug) {
      const p = getPresenceBySlug(slug)
      if (!p) {
        logger.error(`Presence "${slug}" not found`)
        process.exit(1)
      }
      selected = [p]
    } else if (!opts.all) {
      const choices = presences.map((p) => ({ name: p.slug as any, message: `${p.name} (${p.slug})` }))
      const picked = await multiselect("Select presences to push:", choices, { limit: 10 })
      if (picked.length === 0) {
        logger.warning("No presences selected")
        return
      }
      selected = presences.filter((p) => picked.includes(p.slug as any))
    }

    logger.title(`Pushing ${selected.length} presence${selected.length > 1 ? "s" : ""}...`)

    const payload: any[] = []

    for (const p of selected) {
      logger.newline()
      logger.separator()
      logger.raw(`  ${chalk.bold(p.name)} (${p.slug})`)

      spinner.start(`Building bundle...`)
      const bundle = await buildPresence(p)
      if (!bundle) {
        spinner.fail(`Build failed — skipping`)
        continue
      }
      spinner.succeed(`Bundle built (${(bundle.length / 1024).toFixed(1)} kB)`)

      const remote = await fetchPresenceInfo(p.slug)
      const isNew = !remote?.version

      spinner.start(`Checking version...`)

      let version: string
      let changelog: string

      if (isNew) {
        version = "1.0.0"
        changelog = opts.changelog || `✨ Initial release of ${p.name}`
        spinner.succeed(`New presence — version ${version}`)
      } else {
        const current = remote.version
        logger.info(`Current version: ${current}`)

        if (opts.version) {
          version = opts.version
          changelog = opts.changelog || `🔖 ${version}`
          spinner.succeed(`Version set: ${version}`)
        } else if (opts.patch) {
          version = bumpVersion(current, "patch")
          changelog = opts.changelog || `🐛 Patch bump to ${version}`
          spinner.succeed(`Auto patch: ${current} → ${version}`)
        } else if (opts.minor) {
          version = bumpVersion(current, "minor")
          changelog = opts.changelog || `✨ Minor bump to ${version}`
          spinner.succeed(`Auto minor: ${current} → ${version}`)
        } else {
          spinner.stop()

          const strategy = await select("Version strategy:", [
            { name: "patch" as any, message: `Auto patch  ${chalk.dim(current + " → " + bumpVersion(current, "patch"))}` },
            { name: "minor" as any, message: `Auto minor  ${chalk.dim(current + " → " + bumpVersion(current, "minor"))}` },
            { name: "manual" as any, message: "Manual version" },
            { name: "keep" as any, message: `Keep ${current} (no bump)` },
          ])

          if (strategy === "keep") {
            version = current
            changelog = opts.changelog || `📦 ${version}`
          } else if (strategy === "manual") {
            version = await input("Version:", { initial: current })
            changelog = opts.changelog || `🔖 ${version}`
          } else {
            version = bumpVersion(current, strategy)
            changelog = opts.changelog || `📦 ${version}`
          }
        }
      }

      payload.push({
        slug: p.slug,
        type: isNew ? "new" : "modified",
        name: p.name,
        author: p.author,
        authorGithub: p.authorGithub,
        version,
        description: p.description,
        descriptions: p.descriptions,
        changelog,
        bundle,
      })
    }

    if (payload.length === 0) {
      logger.warning("Nothing to push")
      return
    }

    logger.newline()
    spinner.start(`Sending ${payload.length} presence${payload.length > 1 ? "s" : ""} to API...`)

    try {
      const result = await pushPresences(payload)
      spinner.succeed("Push complete!")

      logger.newline()
      for (const r of result.results) {
        logger.success(`${r.slug} → v${r.version}: ${r.changelog}`)
      }
    } catch (err: any) {
      spinner.fail("Push failed")
      logger.error(err.message)
      process.exit(1)
    }
  })

// ── List ──────────────────────────────────────────────────────────────────
program
  .command("list")
  .alias("ls")
  .description("List all presences with local and remote status")
  .action(async () => {
    logger.newline()
    logger.title("Presences")
    logger.newline()

    const presences = getPresences()
    if (presences.length === 0) {
      logger.warning("No presences found")
      return
    }

    const rows: string[] = []
    for (const p of presences) {
      const remote = await fetchPresenceInfo(p.slug)
      const version = remote?.version ? `v${remote.version}` : chalk.dim("—")
      const status = remote?.version ? chalk.green("✓ synced") : chalk.blue("＋ new")

      rows.push(`  ${chalk.bold(p.name.padEnd(20))} ${chalk.dim(p.category.padEnd(12))} ${version.padEnd(10)} ${status}`)
    }

    logger.raw(chalk.dim(`  ${"Name".padEnd(20)} ${"Category".padEnd(12)} ${"Version".padEnd(10)} Status`))
    logger.raw(chalk.dim(`  ${"─".repeat(54)}`))
    for (const row of rows) {
      logger.raw(row)
    }
    logger.newline()
    logger.info(`${presences.length} presence${presences.length > 1 ? "s" : ""} total`)
  })

// ── Validate ──────────────────────────────────────────────────────────────
program
  .command("validate")
  .description("Validate presence metadata and bundle")
  .argument("[slug]", "Presence slug (optional — validates all if omitted)")
  .action(async (slug?: string) => {
    logger.newline()
    logger.title("✦ Validate presences")

    const presences = slug ? [getPresenceBySlug(slug)].filter(Boolean) : getPresences()
    if (presences.length === 0) {
      logger.warning("No presences to validate")
      return
    }

    let ok = 0
    let fail = 0

    for (const p of presences) {
      const issues: string[] = []

      if (!p.metadata.name) issues.push("Missing metadata.name")
      if (!p.metadata.version) issues.push("Missing metadata.version")
      if (!p.metadata.color) issues.push("Missing metadata.color")
      if (!p.metadata.category) issues.push("Missing metadata.category")
      if (!p.metadata.description?.["en-US"]) issues.push("Missing description.en-US")
      if (!p.metadata.assets?.logo) issues.push("Missing assets.logo")
      if (!p.metadata.assets?.icon) issues.push("Missing assets.icon")
      if (!p.metadata.assets?.thumbnail) issues.push("Missing assets.thumbnail")

      const presenceTsPath = join(p.dir, "presence.ts")
      if (!existsSync(presenceTsPath)) issues.push("Missing presence.ts")

      if (issues.length === 0) {
        logger.success(`${p.name} ✓`)
        ok++
      } else {
        logger.error(`${p.name} ✖`)
        for (const issue of issues) {
          logger.sub(`  ${issue}`)
        }
        fail++
      }
    }

    logger.newline()
    logger.info(`${ok} valid, ${fail} with issues`)
  })

// ── Interactive mode ──────────────────────────────────────────────────────
async function runInteractive(): Promise<void> {
  logger.newline()
  logger.raw(chalk.cyan(chalk.bold("  ⚡ Nowly Presence Manager")))
  logger.raw(chalk.dim(`  ${"─".repeat(40)}`))
  logger.newline()

  const action = await select("What would you like to do?", [
    { name: "init" as any, message: "Create a new presence" },
    { name: "build" as any, message: "Build presences" },
    { name: "push" as any, message: "Push presences to API" },
    { name: "list" as any, message: "List all presences" },
    { name: "validate" as any, message: "Validate presences" },
    { name: "exit" as any, message: "Exit" },
  ])

  logger.newline()

  switch (action) {
    case "init":
      await program.parseAsync(["node", "presence", "init"], { from: "user" })
      break
    case "build":
      await program.parseAsync(["node", "presence", "build"], { from: "user" })
      break
    case "push":
      await program.parseAsync(["node", "presence", "push"], { from: "user" })
      break
    case "list":
      await program.parseAsync(["node", "presence", "list"], { from: "user" })
      break
    case "validate":
      await program.parseAsync(["node", "presence", "validate"], { from: "user" })
      break
    case "exit":
      logger.info("Goodbye! 👋")
      process.exit(0)
  }

  logger.newline()
  const again = await confirm("Do something else?", true)
  if (again) {
    await runInteractive()
  } else {
    logger.info("Goodbye! 👋")
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.length <= 2) {
    await runInteractive()
  } else {
    await program.parseAsync()
  }
}

import chalk from "chalk"

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
