import type { Command } from "commander"
import chalk from "chalk"
import { getPresences } from "../discover.js"
import { fetchPresenceInfo } from "../api.js"
import { logger } from "../logger.js"

export const registerList = (program: Command) => {
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
}
