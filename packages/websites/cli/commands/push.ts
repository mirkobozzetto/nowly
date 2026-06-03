import chalk from "chalk"
import type { Command } from "commander"
import { bumpVersion, fetchPresenceInfo, pushPresences } from "@/api"
import { buildPresence } from "@/builder"
import { getPresenceBySlug, getPresences } from "@/discover"
import { logger, spinner } from "@/logger"
import { input, multiselect, select } from "@/prompts"
import { uploadToR2 } from "@/r2"

export const registerPush = (program: Command) => {
  program
    .command("push")
    .description("Build and push presence(s) to API")
    .argument("[slug]", "Presence slug (optional — prompts selection if omitted)")
    .option("-a, --all", "Push all presences (non-interactive)")
    .option("-v, --version <version>", "Explicit version string (skip bump prompt)")
    .option("--patch", "Auto bump patch version")
    .option("--minor", "Auto bump minor version")
    .option("--changelog <text>", "Changelog message")
    .option("--ai", "Let API generate trilingual changelog via AI")
    .action(async (slug?: string, options?: { all?: boolean; version?: string; patch?: boolean; minor?: boolean; changelog?: string; ai?: boolean }) => {
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
      const oldVersions: Record<string, string | undefined> = {}

      for (const p of selected) {
        logger.newline()
        logger.separator()
        logger.raw(`  ${chalk.bold(p.name)} (${p.slug})`)

        spinner.start("Building bundle...")
        const bundle = await buildPresence(p)
        if (!bundle) {
          spinner.fail("Build failed — skipping")
          continue
        }
        spinner.succeed(`Bundle built (${(bundle.length / 1024).toFixed(1)} kB)`)

        const remote = await fetchPresenceInfo(p.slug)
        const isNew = !remote?.version
        const oldVersion = remote?.version

        spinner.start("Checking version...")

        let version: string
        let changelog: string

        if (isNew) {
          version = "1.0.0"
          changelog = opts.ai ? "" : (opts.changelog || `✨ Initial release of ${p.name}`)
          spinner.succeed(`New presence — version ${version}${opts.ai ? " (AI changelog)" : ""}`)
        } else {
          const current = remote.version!
          logger.info(`Current version: ${current}`)

          if (opts.version) {
            version = opts.version
            changelog = opts.changelog || (opts.ai ? "" : `🔖 ${version}`)
            spinner.succeed(`Version set: ${version}`)
          } else if (opts.patch) {
            version = bumpVersion(current, "patch")
            changelog = opts.changelog || (opts.ai ? "" : `🐛 Patch bump to ${version}`)
            spinner.succeed(`Auto patch: ${current} → ${version}`)
          } else if (opts.minor) {
            version = bumpVersion(current, "minor")
            changelog = opts.changelog || (opts.ai ? "" : `✨ Minor bump to ${version}`)
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
              changelog = opts.changelog || (opts.ai ? "" : `📦 ${version}`)
            } else if (strategy === "manual") {
              version = await input("Version:", { initial: current })
              changelog = opts.changelog || (opts.ai ? "" : `🔖 ${version}`)
            } else {
              version = bumpVersion(current, strategy)
              changelog = opts.changelog || (opts.ai ? "" : `📦 ${version}`)
            }
          }
        }

        payload.push({
          slug: p.slug,
          type: isNew ? "new" : "modified",
          name: p.name,
          category: p.category,
          author: p.author.name,
          authorGithub: p.author.github,
          version,
          description: p.description,
          color: p.color,
          url: p.url,
          changelog,
          bundle,
          metadata: {
            slug: p.slug,
            name: p.name,
            version,
            author: p.author,
            contributors: p.contributors,
            description: p.description,
            longDescription: p.longDescription,
            url: p.url,
            color: p.color,
            category: p.category,
            tags: p.tags,
            assets: p.assets,
            features: p.features,
            settings: p.settings,
          },
        })

        oldVersions[p.slug] = oldVersion
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

        for (const r of result.results) {
          spinner.start(`Uploading "${r.slug}" assets to R2...`)
          try {
            const urls = await uploadToR2(r.slug, r.version, oldVersions[r.slug])
            spinner.succeed(`Uploaded ${urls.length} files for "${r.slug}" to CDN`)
          } catch (err: any) {
            spinner.warn(`R2 upload skipped for "${r.slug}": ${err.message}`)
          }
        }
      } catch (err: any) {
        spinner.fail("Push failed")
        logger.error(err.message)
        process.exit(1)
      }
    })
}
