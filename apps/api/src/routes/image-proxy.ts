import type { FastifyInstance } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000

type ImageProxyService = {
  id: string
  hostSuffixes: string[]
  headers?: HeadersInit
}

const SUPPORTED_IMAGE_PROXY_SERVICES: ImageProxyService[] = [
  {
    id: "tiktok",
    hostSuffixes: [
      "tiktokcdn.com",
      "tiktokcdn-eu.com",
      "tiktokcdn-us.com",
      "tiktokcdn-in.com",
    ],
    headers: {
      Referer: "https://www.tiktok.com/",
    },
  },
]

const matchesHostSuffix = (hostname: string, suffixes: string[]): boolean => {
  const host = hostname.toLowerCase()
  return suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))
}

const findServiceForUrl = (url: URL, serviceId?: string): ImageProxyService | undefined => {
  const services = serviceId
    ? SUPPORTED_IMAGE_PROXY_SERVICES.filter(service => service.id === serviceId)
    : SUPPORTED_IMAGE_PROXY_SERVICES

  return services.find(service => matchesHostSuffix(url.hostname, service.hostSuffixes))
}

const parseProxyUrl = (
  rawUrl: string | undefined,
  serviceId?: string,
): { url: URL; service: ImageProxyService } | undefined => {
  if (!rawUrl) return undefined

  try {
    const url = new URL(rawUrl)
    if (url.protocol !== "https:") return undefined
    const service = findServiceForUrl(url, serviceId)
    if (!service) return undefined
    return { url, service }
  } catch {
    return undefined
  }
}

export const imageProxyRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: { url?: string; service?: string; [key: string]: string | undefined } }>("/image-proxy", async (request, reply) => {
    const extraParams = Object.keys(request.query).filter(key => key !== "url" && key !== "service")
    if (extraParams.length > 0) {
      return reply.status(400).send({
        error: "Image URL must be encoded",
        message: "Encode the full image URL with encodeURIComponent before passing it to the url parameter.",
      })
    }

    const target = parseProxyUrl(request.query.url, request.query.service)
    if (!target) {
      return reply.status(400).send({ error: "Invalid image URL" })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(target.url, {
        signal: controller.signal,
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
          ...target.service.headers,
        },
      })

      if (!response.ok) {
        return reply.status(response.status >= 400 && response.status < 500 ? response.status : 502).send({ error: "Image fetch failed" })
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0)
      if (contentLength > MAX_IMAGE_BYTES) {
        return reply.status(413).send({ error: "Image too large" })
      }

      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()
      if (!contentType?.startsWith("image/")) {
        return reply.status(415).send({ error: "Unsupported content type" })
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        return reply.status(413).send({ error: "Image too large" })
      }

      return reply
        .header("Content-Type", contentType)
        .header("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
        .send(buffer)
    } catch {
      return reply.status(502).send({ error: "Image fetch failed" })
    } finally {
      clearTimeout(timeout)
    }
  })
}
