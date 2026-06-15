import { createHash } from "crypto"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000
const CACHED_IMAGE_TTL_SECONDS = 5 * 60
const CACHED_IMAGE_STALE_SECONDS = 60
const PUBLIC_IMAGE_PROXY_ORIGIN = "*"
const MAX_CACHE_ENTRIES = 2_000

type ImageProxyService = {
  id: string
  hostSuffixes: string[]
  headers?: HeadersInit
}

type CachedImage = {
  contentType: string
  body: string
  expiresAt: number
}

const cache = new Map<string, CachedImage>()

const services: ImageProxyService[] = [
  {
    id: "youtube",
    hostSuffixes: ["ytimg.com", "ggpht.com", "youtube.com", "googleusercontent.com"],
    headers: { "User-Agent": "Nowly/1.0" },
  },
  {
    id: "twitch",
    hostSuffixes: ["twitch.tv", "ttvnw.net", "jtvnw.net"],
  },
  {
    id: "disney",
    hostSuffixes: ["disney.com", "disney-plus.net", "dssott.com", "bamgrid.com", "disneystreaming.com"],
  },
  {
    id: "netflix",
    hostSuffixes: ["netflix.com", "nflxvideo.net", "nflximg.net", "nflxext.com", "nflxso.net"],
  },
  {
    id: "prime",
    hostSuffixes: ["primevideo.com", "amazon.com", "amazonaws.com", "amazonvideo.com", "media-amazon.com"],
  },
  {
    id: "apple",
    hostSuffixes: ["apple.com", "tv.apple.com"],
  },
  {
    id: "tiktok",
    hostSuffixes: ["tiktokcdn.com", "tiktokcdn-eu.com", "tiktokcdn-us.com", "tiktokv.com"],
    headers: { Referer: "https://www.tiktok.com/" },
  },
]

// SEC-02: a host matches a service only when it is the exact domain or a
// subdomain of it. A bare `endsWith` would let "evil-ytimg.com" match "ytimg.com".
const hostMatchesSuffix = (hostname: string, suffix: string): boolean =>
  hostname === suffix || hostname.endsWith(`.${suffix}`)

// SEC-02: reject hostnames that point at private / loopback / link-local space
// (e.g. 127.0.0.1, 169.254.169.254 cloud metadata, 10/172.16/192.168 ranges,
// IPv6 loopback/ULA/link-local) to prevent the proxy being used for SSRF.
const isBlockedHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".localhost")) return true
  if (host.endsWith(".local") || host.endsWith(".internal")) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }

  if (host.includes(":")) {
    if (host === "::1" || host === "::") return true
    if (host.startsWith("fe80") || host.startsWith("fc") || host.startsWith("fd")) return true
    if (host.startsWith("::ffff:")) return true
  }

  return false
}

const parseProxyUrl = (url?: string, serviceId?: string): { url: URL; service: ImageProxyService } | null => {
  if (!url?.trim()) return null

  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== "https:") return null
    if (isBlockedHost(parsed.hostname)) return null

    const matchedService = serviceId
      ? services.find((s) => s.id === serviceId)
      : services.find((s) => s.hostSuffixes.some((suffix) => hostMatchesSuffix(parsed.hostname, suffix)))

    // A matched service must actually whitelist the host (covers explicit
    // serviceId calls); services with no suffixes are never accepted.
    if (!matchedService) return null
    if (!matchedService.hostSuffixes.some((suffix) => hostMatchesSuffix(parsed.hostname, suffix))) return null

    return { url: parsed, service: matchedService }
  } catch { return null }
}

const createCacheId = (serviceId: string, href: string): string =>
  createHash("sha256").update(`${serviceId}:${href}`).digest("base64url").slice(0, 32)

const cacheKey = (id: string): string => `image-proxy:cached:${id}`

const getCached = (id: string): CachedImage | undefined => {
  const cached = cache.get(id)
  if (!cached) return undefined
  if (Date.now() >= cached.expiresAt) {
    cache.delete(id)
    return undefined
  }
  return cached
}

const setCached = (id: string, image: Omit<CachedImage, "expiresAt">): void => {
  // SEC-13: bound the in-memory cache so it cannot be grown without limit.
  // Evict expired entries first, then the oldest one if still at capacity.
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now()
    for (const [key, value] of cache) {
      if (value.expiresAt <= now) cache.delete(key)
    }
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
  }

  const expiresAt = Date.now() + CACHED_IMAGE_TTL_SECONDS * 1000
  cache.set(id, { ...image, expiresAt })
  setTimeout(() => { if (cache.get(id)?.expiresAt === expiresAt) cache.delete(id) }, CACHED_IMAGE_STALE_SECONDS * 1000)
}

const withPublicCors = (reply: FastifyReply): FastifyReply =>
  reply.header("Access-Control-Allow-Origin", PUBLIC_IMAGE_PROXY_ORIGIN)

const imageResponse = (
  reply: FastifyReply,
  image: { contentType: string; buffer: Buffer },
  maxAge?: number,
): void => {
  const headers: Record<string, string> = {
    "Content-Type": image.contentType,
    "Content-Length": String(image.buffer.byteLength),
    "Cache-Control": `public, max-age=${Math.max(0, maxAge ?? CACHED_IMAGE_TTL_SECONDS)}`,
    "X-Content-Type-Options": "nosniff",
  }

  withPublicCors(reply).headers(headers).send(image.buffer)
}

const fetchImage = async (url: URL, service: ImageProxyService): Promise<
  { ok: true; buffer: Buffer; contentType: string; status: number } |
  { ok: false; status: number; error: string }
> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      headers: service.headers ?? { "User-Agent": "Nowly/1.0" },
      redirect: "follow",
      size: MAX_IMAGE_BYTES,
    } as RequestInit)

    if (!response.ok) {
      return { ok: false, status: response.status, error: `Upstream returned ${response.status}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get("Content-Type") || "image/webp"

    if (response.headers.has("Content-Length") && buffer.byteLength > MAX_IMAGE_BYTES) {
      return { ok: false, status: 413, error: "Image too large" }
    }

    if (buffer.byteLength === 0) {
      return { ok: false, status: 502, error: "Empty image" }
    }

    return { ok: true, buffer, contentType, status: response.status }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, status: 504, error: "Fetch timeout" }
    }
    return { ok: false, status: 502, error: "Fetch failed" }
  } finally {
    clearTimeout(timeout)
  }
}

const getPublicBaseUrl = (request: FastifyRequest): string =>
  process.env.PUBLIC_URL || `${request.protocol}://${request.hostname}${request.port ? `:${request.port}` : ""}`

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(imageProxyRoutes)
}

export const imageProxyRoutes = async (fastify: FastifyInstance) => {
  fastify.options("/images-proxy", async (_request, reply) =>
    withPublicCors(reply).status(204).send()
  )

  fastify.post<{ Body: { service?: string; url?: string } }>("/images-proxy", async (request, reply) => {
    const target = parseProxyUrl(request.body?.url, request.body?.service)
    if (!target) {
      return withPublicCors(reply).status(400).send({ error: "Invalid image URL" })
    }

    const id = createCacheId(target.service.id, target.url.href)
    const existing = getCached(id)
    if (existing) {
      return withPublicCors(reply).send({
        url: `${getPublicBaseUrl(request)}/images-proxy/${id}`,
        expiresIn: CACHED_IMAGE_TTL_SECONDS,
      })
    }

    const image = await fetchImage(target.url, target.service)
    if (!image.ok) {
      return withPublicCors(reply).status(image.status).send({ error: image.error })
    }

    setCached(id, {
      contentType: image.contentType,
      body: image.buffer.toString("base64"),
    })

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

    const cached = getCached(id)
    if (!cached) {
      return reply.status(404).send({ error: "Image not found" })
    }

    return imageResponse(reply, {
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
    return imageResponse(reply, image)
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
    return imageResponse(reply, image)
  })
}
