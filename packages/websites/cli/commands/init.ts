import type { Command } from "commander"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { SRC, getLetterFromName, getSlugFromName } from "@/discover"
import { logger, spinner } from "@/logger"
import { confirm, input, select } from "@/prompts"
import { metadataJson, presenceTs } from "@/templates/presence"

export const registerInit = (program: Command) => {
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
        { name: "video", message: "Videos" },
        { name: "social", message: "Social" },
        { name: "gaming", message: "Gaming" },
        { name: "tools", message: "Tools" },
        { name: "ai", message: "AI" },
        { name: "learning", message: "Learning" },
        { name: "creator", message: "Creators" },
        { name: "other", message: "Other" },
      ])

      const color = await input("Brand color (hex):", { initial: "#555555" })
      const urlsInput = await input("URLs (comma-separated):")
      const urls = urlsInput.split(",").map((u: string) => u.trim()).filter(Boolean)
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

      writeFileSync(join(dir, "metadata.json"), metadataJson({ name, author, github, category, color, urls, descriptionEn, descriptionFr, descriptionEs }))
      writeFileSync(join(dir, "presence.ts"), presenceTs)

      spinner.succeed(`Presence "${name}" created at ${dir}`)
      logger.info(`Slug: ${slug}`)
      logger.info(`Next: run \`pnpm presence build ${slug}\` to build it`)
    })
}
