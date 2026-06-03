#!/usr/bin/env node
import { registerBuild } from "@/commands/build"
import { registerInit } from "@/commands/init"
import { registerList } from "@/commands/list"
import { registerPush } from "@/commands/push"
import { registerR2Sync } from "@/commands/r2-sync"
import { registerValidate } from "@/commands/validate"
import { logger } from "@/logger"
import { confirm, select } from "@/prompts"
import chalk from "chalk"
import { Command } from "commander"
import "dotenv/config"

const program = new Command()
  .name("presence")
  .description("Nowly presence manager — create, build, and push presences")
  .version("1.0.0")

registerInit(program)
registerBuild(program)
registerPush(program)
registerList(program)
registerValidate(program)
registerR2Sync(program)

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

async function main() {
  if (process.argv.length <= 2) {
    await runInteractive()
  } else {
    await program.parseAsync()
  }
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})