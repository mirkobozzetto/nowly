import type { Command } from "commander"
import { logger } from "../logger.js"
import { uploadToR2, uploadAllToR2 } from "../r2.js"

export const registerR2Sync = (program: Command) => {
  program
    .command("r2:sync")
    .description("Upload built presence assets and bundles to Cloudflare R2")
    .argument("[slug]", "Presence slug (optional — syncs all if omitted)")
    .action(async (slug?: string) => {
      logger.newline()
      logger.title("✦ Sync to Cloudflare R2")

      try {
        if (slug) {
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
}
