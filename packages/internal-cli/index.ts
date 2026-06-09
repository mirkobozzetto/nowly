#!/usr/bin/env node
import { uploadAllToR2, uploadHostReleaseToR2 } from "@nowly/websites/cli/r2"
import { registerPush } from "@nowly/websites/cli/commands/push"
import { logger } from "@nowly/websites/cli/logger"
import { existsSync } from "fs"
import { resolve } from "path"
import chalk from "chalk"
import { Command } from "commander"
import "dotenv/config"

const program = new Command()
  .name("nowly-admin")
  .description("Nowly admin CLI — internal commands for releases, CDN sync, and publishing")
  .version("1.0.0")

registerPush(program)

program
  .command("r2:sync")
  .description("Upload built presence assets and bundles to Cloudflare R2")
  .argument("[slug]", "Presence slug (optional — syncs all if omitted)")
  .action(async (slug?: string) => {
    logger.newline()
    logger.title("✦ Sync to Cloudflare R2")

    try {
      if (slug) {
        const { uploadToR2 } = await import("@nowly/websites/cli/r2")
        const urls = await uploadToR2(slug)
        logger.newline()
        for (const url of urls) logger.success(url)
      } else {
        await uploadAllToR2()
      }
      logger.newline()
      logger.success("R2 sync complete")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

program
  .command("host:publish")
  .description("Upload Nowly native host release artifacts to Cloudflare R2")
  .requiredOption("--release-version <version>", "Host release version")
  .requiredOption("--installer <path>", "Path to nowly setup executable")
  .option("--portable <path>", "Path to Windows portable zip archive")
  .option("--linux <path>", "Path to Linux tar.gz archive")
  .option("--macos <path>", "Path to macOS tar.gz archive")
  .action(async (options: { releaseVersion: string; installer: string; portable?: string; linux?: string; macos?: string }) => {
    const resolveArtifactPath = (path: string | undefined): string | undefined => {
      if (!path) return undefined
      const fromCurrent = resolve(path)
      if (existsSync(fromCurrent)) return fromCurrent
      const fromRoot = resolve(process.cwd(), "../..", path)
      if (existsSync(fromRoot)) return fromRoot
      return fromCurrent
    }

    logger.newline()
    logger.title("Host release publish")

    try {
      const manifest = await uploadHostReleaseToR2(
        options.releaseVersion,
        resolveArtifactPath(options.installer)!,
        resolveArtifactPath(options.portable),
        resolveArtifactPath(options.linux),
        resolveArtifactPath(options.macos),
      )
      logger.success(`Published host v${manifest.version}`)
      logger.success(manifest.windows.installer.url)
      if (manifest.windows.portable) logger.success(manifest.windows.portable.url)
      if (manifest.linux) logger.success(manifest.linux.archive.url)
      if (manifest.macos) logger.success(manifest.macos.archive.url)
      logger.success("Published installer/latest.json")
    } catch (err: any) {
      logger.error(err.message)
      process.exit(1)
    }
  })

async function main() {
  if (process.argv.length <= 2) {
    logger.raw(chalk.cyan(chalk.bold("  ⚡ Nowly Admin CLI")))
    logger.raw(chalk.dim(`  ${"─".repeat(40)}`))
    logger.newline()
    logger.info("Usage: pnpm admin <command>")
    logger.newline()
    logger.raw(chalk.dim("  Commands:"))
    logger.raw(chalk.dim("    push           Build and push presence(s) to API"))
    logger.raw(chalk.dim("    r2:sync        Upload presence assets to CDN"))
    logger.raw(chalk.dim("    host:publish   Publish native host release"))
    logger.newline()
  } else {
    await program.parseAsync()
  }
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
