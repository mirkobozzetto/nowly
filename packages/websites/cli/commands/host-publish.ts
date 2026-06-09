import type { Command } from "commander"
import { logger } from "@/logger"
import { uploadHostReleaseToR2 } from "@/r2"
import { existsSync } from "fs"
import { resolve } from "path"

const resolveArtifactPath = (path: string | undefined): string | undefined => {
  if (!path) return undefined

  const fromCurrentDirectory = resolve(path)
  if (existsSync(fromCurrentDirectory)) return fromCurrentDirectory

  const fromRepositoryRoot = resolve(process.cwd(), "../..", path)
  if (existsSync(fromRepositoryRoot)) return fromRepositoryRoot

  return fromCurrentDirectory
}

export const registerHostPublish = (program: Command) => {
  program
    .command("host:publish")
    .description("Upload Nowly native host release artifacts to Cloudflare R2")
    .requiredOption("--release-version <version>", "Host release version")
    .requiredOption("--installer <path>", "Path to nowly setup executable")
    .option("--portable <path>", "Path to Windows portable zip archive")
    .option("--linux <path>", "Path to Linux tar.gz archive")
    .option("--macos <path>", "Path to macOS tar.gz archive")
    .action(async (options: { releaseVersion: string; installer: string; portable?: string; linux?: string; macos?: string }) => {
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
}
