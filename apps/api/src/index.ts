import { autoloadRoutes } from "@/lib/autoload-routes"
import cors from "@fastify/cors"
import { serverEnv } from "@nowly/env/server"
import Fastify from "fastify"

const server = Fastify({ logger: true, ignoreTrailingSlash: true })

await server.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-token"],
})

server.get("/health", async () => {
  return {
    ok: true,
    service: "nowly-api",
    checkedAt: new Date().toISOString(),
  }
})

await autoloadRoutes(server)

const port = serverEnv.PORT

try {
  await server.listen({ port, host: "0.0.0.0" })
  console.log(`API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
