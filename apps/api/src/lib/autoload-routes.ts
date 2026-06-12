import { readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { FastifyInstance } from "fastify"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FEATURES_DIR = join(__dirname, "..", "features")

type RouteModule = {
  register?: (app: FastifyInstance) => Promise<void>
}

export async function autoloadRoutes(app: FastifyInstance): Promise<void> {
  const entries = readdirSync(FEATURES_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    try {
      const mod: RouteModule = await import(join(FEATURES_DIR, entry.name, `${entry.name}.routes.ts`))
      if (mod.register) {
        await mod.register(app)
      }
    } catch {
      // Silently skip features without routes
    }
  }
}
