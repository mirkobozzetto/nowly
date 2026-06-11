import type { FastifyInstance, FastifyReply } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000

type ImageProxyService = {
  id: string
  hostSuffixes: string[]
  headers?: HeadersInit
  pageHeaders?: HeadersInit
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
    pageHeaders: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

const fetchPageImage = async (
  pageUrl: URL,
  service: ImageProxyService,
): Promise<URL | undefined> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        ...service.pageHeaders,
      },
    })

    if (!response.ok) return undefined

    const html = await response.text()
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    const rawImage = match?.[1]?.replace(/&amp;/g, "&")
    if (!rawImage) return undefined

    const imageUrl = new URL(rawImage)
    if (imageUrl.protocol !== "https:") return undefined
    if (!matchesHostSuffix(imageUrl.hostname, service.hostSuffixes)) return undefined
    return imageUrl
  } catch {
    return undefined
  } finally {
    clearTimeout(timeout)
  }
}

const sendImage = (
  reply: FastifyReply,
  image: { buffer: Buffer; contentType: string },
) => reply
  .header("Content-Type", image.contentType)
  .header("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
  .send(image.buffer)

export const imageProxyRoutes = async (fastify: FastifyInstance) => {
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

  fastify.get<{ Params: { handle: string; videoId: string } }>("/image-proxy/tiktok/video/:handle/:videoId", async (request, reply) => {
    const service = SUPPORTED_IMAGE_PROXY_SERVICES.find(s => s.id === "tiktok")
    if (!service) return reply.status(404).send({ error: "Unsupported service" })

    const handle = request.params.handle.replace(/^@/, "")
    if (!/^[a-zA-Z0-9._]{1,64}$/.test(handle) || !/^\d{5,32}$/.test(request.params.videoId)) {
      return reply.status(400).send({ error: "Invalid TikTok video reference" })
    }

    const imageUrl = await fetchPageImage(new URL(`https://www.tiktok.com/@${handle}/video/${request.params.videoId}`), service)
    if (!imageUrl) return reply.status(404).send({ error: "Image not found" })

    const image = await fetchImage(imageUrl, service)
    if (!image.ok) return reply.status(image.status).send({ error: image.error })
    return sendImage(reply, image)
  })

  fastify.get<{ Params: { handle: string } }>("/image-proxy/tiktok/profile/:handle", async (request, reply) => {
    const service = SUPPORTED_IMAGE_PROXY_SERVICES.find(s => s.id === "tiktok")
    if (!service) return reply.status(404).send({ error: "Unsupported service" })

    const handle = request.params.handle.replace(/^@/, "")
    if (!/^[a-zA-Z0-9._]{1,64}$/.test(handle)) {
      return reply.status(400).send({ error: "Invalid TikTok profile reference" })
    }

    const imageUrl = await fetchPageImage(new URL(`https://www.tiktok.com/@${handle}`), service)
    if (!imageUrl) return reply.status(404).send({ error: "Image not found" })

    const image = await fetchImage(imageUrl, service)
    if (!image.ok) return reply.status(image.status).send({ error: image.error })
    return sendImage(reply, image)
  })

  fastify.get<{ Params: { section: string; category: string } }>("/image-proxy/tiktok/category/:section/:category", async (request, reply) => {
    const service = SUPPORTED_IMAGE_PROXY_SERVICES.find(s => s.id === "tiktok")
    if (!service) return reply.status(404).send({ error: "Unsupported service" })

    const { section, category } = request.params
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(section) || !/^[a-zA-Z0-9_.-]{1,128}$/.test(category)) {
      return reply.status(400).send({ error: "Invalid TikTok category reference" })
    }

    const imageUrl = await fetchPageImage(new URL(`https://www.tiktok.com/live/category/${section}/${category}`), service)
    if (!imageUrl) return reply.status(404).send({ error: "Image not found" })

    const image = await fetchImage(imageUrl, service)
    if (!image.ok) return reply.status(image.status).send({ error: image.error })
    return sendImage(reply, image)
  })
}
