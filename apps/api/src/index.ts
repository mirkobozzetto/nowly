import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { registryRoutes } from "@/routes/registry"
import { presenceRoutes } from "@/routes/presence"
import { bundleRoutes } from "@/routes/bundle"
import { assetsRoutes } from "@/routes/assets"
import { releaseRoutes } from "@/routes/release"
import { statsRoutes } from "@/routes/stats"
import { adminRoutes } from "@/routes/admin"

const server = Fastify({ logger: true })

await server.register(cors, { origin: true })

await server.register(registryRoutes, { prefix: "/presences" })
await server.register(presenceRoutes, { prefix: "/presences" })
await server.register(bundleRoutes, { prefix: "/presences" })
await server.register(assetsRoutes, { prefix: "/presences" })
await server.register(releaseRoutes, { prefix: "/presences" })
await server.register(statsRoutes, { prefix: "/presences" })
await server.register(adminRoutes, { prefix: "/presences" })

const port = Number(process.env.PORT) || 3001

try {
  await server.listen({ port, host: "0.0.0.0" })
  console.log(`API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
