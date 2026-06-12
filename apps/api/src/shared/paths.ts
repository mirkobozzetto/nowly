import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = resolve(__dirname, "..", "..", "..", "..")

export const PRESENCES_DIR = join(ROOT, "packages", "websites", "dist", "presences")
