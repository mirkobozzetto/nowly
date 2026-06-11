import { redis } from "@/lib/redis"
import { createHash } from "crypto"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000
const CACHED_IMAGE_TTL_SECONDS = 5 * 60
const CACHED_IMAGE_STALE_SECONDS = 60
const CACHED_IMAGE_KEY_PREFIX = "image-proxy:cached"
const PUBLIC_IMAGE_PROXY_ORIGIN = "*"

type ImageProxyService = {
  id: string
  hostSuffixes: string[]
  headers?: HeadersInit
}

type CachedImage = {
  contentType: string
  body: string
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

const cacheKey = (id: string): string => `${CACHED_IMAGE_KEY_PREFIX}:${id}`

const createCacheId = (serviceId: string, imageUrl: string): string =>
  createHash("sha256")
    .update(serviceId)
    .update("\0")
    .update(imageUrl)
    .digest("base64url")
    .slice(0, 24)

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

const fetchImage = async (
  url: URL,
  service: ImageProxyService,
): Promise<{ ok: true; buffer: Buffer; contentType: string } | { ok: false; status: number; error: string }> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        ...service.headers,
      },
    })

    if (!response.ok) {
      return { ok: false, status: response.status >= 400 && response.status < 500 ? response.status : 502, error: "Image fetch failed" }
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return { ok: false, status: 413, error: "Image too large" }
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()
    if (!contentType?.startsWith("image/")) {
      return { ok: false, status: 415, error: "Unsupported content type" }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return { ok: false, status: 413, error: "Image too large" }
    }

    return { ok: true, buffer, contentType }
  } catch {
    return { ok: false, status: 502, error: "Image fetch failed" }
  } finally {
    clearTimeout(timeout)
  }
}

const sendImage = (
  reply: FastifyReply,
  image: { buffer: Buffer; contentType: string },
  maxAge = 86400,
) => reply
  .header("Content-Type", image.contentType)
  .header("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${CACHED_IMAGE_STALE_SECONDS}`)
  .send(image.buffer)

const withPublicCors = (reply: FastifyReply): FastifyReply =>
  reply
    .header("Access-Control-Allow-Origin", PUBLIC_IMAGE_PROXY_ORIGIN)
    .header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    .header("Access-Control-Allow-Headers", "Content-Type")

const getPublicBaseUrl = (request: FastifyRequest): string => {
  const forwardedProto = request.headers["x-forwarded-proto"]
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto

  const protocol = proto === "https" || request.hostname === "api.nowly.me"
    ? "https"
    : request.protocol

  return `${protocol}://${request.hostname}`
}

export const imageProxyRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", PUBLIC_IMAGE_PROXY_ORIGIN)
    reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    reply.header("Access-Control-Allow-Headers", "Content-Type")
    if (request.method === "OPTIONS" && !reply.sent) {
      reply.status(204).send()
    }
  })

  fastify.options("/images-proxy", async (_request, reply) =>
    withPublicCors(reply).status(204).send()
  )

  fastify.post<{ Body: { service?: string; url?: string } }>("/images-proxy", async (request, reply) => {
    const target = parseProxyUrl(request.body?.url, request.body?.service)
    if (!target) {
      return withPublicCors(reply).status(400).send({ error: "Invalid image URL" })
    }

    const id = createCacheId(target.service.id, target.url.href)
    const existing = await redis.get<CachedImage>(cacheKey(id))
    if (existing?.contentType && existing.body) {
      return withPublicCors(reply).send({
        url: `${getPublicBaseUrl(request)}/images-proxy/${id}`,
        expiresIn: CACHED_IMAGE_TTL_SECONDS,
      })
    }

    const image = await fetchImage(target.url, target.service)
    if (!image.ok) {
      return withPublicCors(reply).status(image.status).send({ error: image.error })
    }

    await redis.set(cacheKey(id), {
      contentType: image.contentType,
      body: image.buffer.toString("base64"),
    } satisfies CachedImage, { ex: CACHED_IMAGE_TTL_SECONDS })

    return withPublicCors(reply).send({
      url: `${getPublicBaseUrl(request)}/images-proxy/${id}`,
      expiresIn: CACHED_IMAGE_TTL_SECONDS,
    })
  })

  fastify.get<{ Params: { id: string } }>("/images-proxy/:id", async (request, reply) => {
    const { id } = request.params
    if (!/^[a-zA-Z0-9_-]{16,64}$/.test(id)) {
      return reply.status(400).send({ error: "Invalid image id" })
    }

    const cached = await redis.get<CachedImage>(cacheKey(id))
    if (!cached?.contentType || !cached.body) {
      return reply.status(404).send({ error: "Image not found" })
    }

    return sendImage(reply, {
      contentType: cached.contentType,
      buffer: Buffer.from(cached.body, "base64"),
    }, CACHED_IMAGE_TTL_SECONDS)
  })

  fastify.get<{ Querystring: { u?: string; [key: string]: string | undefined } }>("/i", async (request, reply) => {
    const extraParams = Object.keys(request.query).filter(key => key !== "u")
    if (extraParams.length > 0) {
      return reply.status(400).send({
        error: "Image URL must be encoded",
        message: "Encode the full image URL with encodeURIComponent before passing it to the u parameter.",
      })
    }

    const target = parseProxyUrl(request.query.u)
    if (!target) {
      return reply.status(400).send({ error: "Invalid image URL" })
    }

    const image = await fetchImage(target.url, target.service)
    if (!image.ok) {
      return reply.status(image.status).send({ error: image.error })
    }
    return sendImage(reply, image)
  })

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

    const image = await fetchImage(target.url, target.service)
    if (!image.ok) {
      return reply.status(image.status).send({ error: image.error })
    }
    return sendImage(reply, image)
  })

}
