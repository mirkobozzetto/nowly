import type { FastifyInstance } from "fastify"
import { readdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath, pathToFileURL } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FEATURES_DIR = join(__dirname, "..", "features")

type RouteModule = {
  register?: (app: FastifyInstance) => Promise<void>
}

export const autoloadRoutes = async (app: FastifyInstance): Promise<void> => {
  const entries = readdirSync(FEATURES_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    try {
      const routePath = join(FEATURES_DIR, entry.name, `${entry.name}.routes.ts`)
      const mod: RouteModule = await import(pathToFileURL(routePath).href)
      if (mod.register) {
        await mod.register(app)
      }
    } catch {
      // Silently skip features without routes
    }
  }
}