import chalk from "chalk"
import { execFileSync } from "child_process"
import type { Command } from "commander"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { bumpVersion, fetchPresenceInfo, pushPresences } from "@/api"
import { buildPresence } from "@/builder"
import { DIST, getPresenceBySlug, getPresences } from "@/discover"
import { logger, spinner } from "@/logger"
import { input, multiselect, select } from "@/prompts"
import { uploadToR2 } from "@/r2"

const MAX_DIFF_SUMMARY_LENGTH = 12000

type ReleasePerson = {
  name: string
  github?: string
}

const runGit = (args: string[]): string | undefined => {
  try {
    const output = execFileSync("git", args, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    return output || undefined
  } catch {
    return undefined
  }
}

const splitNames = (value?: string): string[] =>
  value
    ? value.split(",").map((name) => name.trim()).filter(Boolean)
    : []

const toReleasePerson = (value: string): ReleasePerson => {
  const trimmed = value.trim().replace(/^@/, "")
  const [namePart, githubPart] = trimmed.split(":").map((part) => part.trim()).filter(Boolean)
  const github = githubPart || (/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(namePart) ? namePart : undefined)

  return {
    name: namePart,
    ...(github ? { github } : {}),
  }
}

const getLocalReleaseAuthor = (author?: string, authors?: string): ReleasePerson | undefined => {
  const authorList = splitNames(authors)
  const value = author?.trim() || authorList[0] || runGit(["config", "github.user"]) || runGit(["config", "user.name"])
  return value ? toReleasePerson(value) : undefined
}

const getLocalReleaseContributors = (releaseAuthor?: ReleasePerson, authors?: string): ReleasePerson[] => {
  const contributors = splitNames(authors).map(toReleasePerson)
  const seen = new Set<string>()

  return contributors.filter((contributor) => {
    const key = contributor.github ?? contributor.name
    if (releaseAuthor && key === (releaseAuthor.github ?? releaseAuthor.name)) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

type PushOptions = {
  all?: boolean
  version?: string
  patch?: boolean
  minor?: boolean
  changelog?: string
  author?: string
  authors?: string
  ai?: boolean
  base?: string
  head?: string
  pr?: string
  prTitle?: string
  source?: "cli" | "pr"
}

const getGitRange = (opts: PushOptions): string | undefined =>
  opts.base && opts.head ? `${opts.base}...${opts.head}` : undefined

const getPresenceChangedFiles = (presenceDir: string, range?: string): string[] => {
  const files = new Set<string>()
  const outputs = range
    ? [runGit(["diff", "--name-only", range, "--", presenceDir])]
    : [
        runGit(["diff", "--name-only", "--", presenceDir]),
        runGit(["diff", "--cached", "--name-only", "--", presenceDir]),
      ]

  for (const output of outputs) {
    for (const file of output?.split("\n") ?? []) {
      if (file.trim()) files.add(file.trim().replaceAll("\\", "/"))
    }
  }

  return [...files]
}

const getPresenceDiffSummary = (presenceDir: string, range?: string): string | undefined => {
  const diff = (range
    ? [runGit(["diff", "--unified=3", range, "--", presenceDir])]
    : [
        runGit(["diff", "--", presenceDir]),
        runGit(["diff", "--cached", "--", presenceDir]),
      ]).filter(Boolean).join("\n\n")

  if (!diff) return undefined
  return diff.length > MAX_DIFF_SUMMARY_LENGTH
    ? `${diff.slice(0, MAX_DIFF_SUMMARY_LENGTH)}\n[diff truncated]`
    : diff
}

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
    .option("--author <name>", "Release author")
    .option("--authors <names>", "Comma-separated release authors/contributors")
    .option("--ai", "Let API generate trilingual changelog via AI")
    .option("--base <sha>", "Base git SHA for PR/change metadata")
    .option("--head <sha>", "Head git SHA for PR/change metadata")
    .option("--pr <number>", "Pull request reference, for example #10")
    .option("--pr-title <title>", "Pull request title")
    .option("--source <source>", "Release source: cli or pr", "cli")
    .action(async (slug?: string, options?: PushOptions) => {
      const opts = options || {}
      const range = getGitRange(opts)
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
        let versionType: "new" | "patch" | "minor" | "manual" | "keep"

        if (isNew) {
          version = "1.0.0"
          versionType = "new"
          changelog = opts.changelog || ""
          spinner.succeed(`New presence — version ${version}${opts.ai ? " (AI changelog)" : ""}`)
        } else {
          const current = remote.version!
          logger.info(`Current version: ${current}`)

          if (opts.version) {
            version = opts.version
            versionType = "manual"
            changelog = opts.changelog || ""
            spinner.succeed(`Version set: ${version}`)
          } else if (opts.patch) {
            version = bumpVersion(current, "patch")
            versionType = "patch"
            changelog = opts.changelog || ""
            spinner.succeed(`Auto patch: ${current} → ${version}`)
          } else if (opts.minor) {
            version = bumpVersion(current, "minor")
            versionType = "minor"
            changelog = opts.changelog || ""
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
              versionType = "keep"
              changelog = opts.changelog || ""
            } else if (strategy === "manual") {
              version = await input("Version:", { initial: current })
              versionType = "manual"
              changelog = opts.changelog || ""
            } else {
              version = bumpVersion(current, strategy)
              versionType = strategy
              changelog = opts.changelog || ""
            }
          }
        }

        const settingsPath = join(DIST, "presences", p.slug, "settings.json")
        const settings = existsSync(settingsPath)
          ? JSON.parse(readFileSync(settingsPath, "utf-8"))
          : undefined
        const metadata = {
          slug: p.slug,
          ...p.metadata,
          version,
          settings,
        }
        const releaseAuthor = getLocalReleaseAuthor(opts.author, opts.authors)
        const releaseContributors = getLocalReleaseContributors(releaseAuthor, opts.authors)
        const changedFiles = getPresenceChangedFiles(p.dir, range)
        const diffSummary = getPresenceDiffSummary(p.dir, range)
        const commitSha = opts.head || runGit(["rev-parse", "HEAD"])

        writeFileSync(join(DIST, "presences", p.slug, "metadata.json"), JSON.stringify(metadata, null, 2))

        payload.push({
          slug: p.slug,
          type: isNew ? "new" : "modified",
          name: p.name,
          category: p.category,
          author: p.metadata.author?.name || p.author,
          authorGithub: p.metadata.author?.github,
          releaseAuthor,
          releaseContributors,
          version,
          versionType,
          description: p.descriptions,
          color: p.metadata.color,
          url: p.metadata.url,
          changelog,
          bundle,
          source: opts.source ?? "cli",
          commitSha,
          changedFiles,
          diffSummary,
          metadata,
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
        const result = await pushPresences(payload, {
          pr: opts.pr,
          prTitle: opts.prTitle,
          changes: range ? runGit(["log", "--oneline", range]) : undefined,
        })
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
