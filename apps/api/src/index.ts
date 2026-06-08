import { assetsRoutes } from "@/routes/assets"
import { authRoutes } from "@/routes/auth"
import { presenceRoutes } from "@/routes/presence"
import { registryRoutes } from "@/routes/registry"
import { statsRoutes } from "@/routes/stats"
import cors from "@fastify/cors"
import { serverEnv } from "@nowly/env/server"
import Fastify from "fastify"

const server = Fastify({ logger: true })

await server.register(cors, {
  origin: [serverEnv.FRONTEND_URL],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-token"],
})

await server.register(registryRoutes, { prefix: "/presences" })
await server.register(presenceRoutes, { prefix: "/presences" })
await server.register(assetsRoutes, { prefix: "/presences" })
await server.register(statsRoutes, { prefix: "/presences" })
await server.register(authRoutes, { prefix: "/auth" })

const port = serverEnv.PORT

try {
  await server.listen({ port, host: "0.0.0.0" })
  console.log(`API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
