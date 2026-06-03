import { cleanUploader, cleanTitle, isRecord, extractTextValue, extractTitleValue, parseJSONScript, decodeHtml, textFromHTML } from "./text"

export const shortsPageDataCache = new Map<string, Promise<{ title?: string; uploader?: string }>>()
export const shortsOEmbedDataCache = new Map<string, Promise<{ title?: string; uploader?: string }>>()
export const shortsUploaderCache = new Map<string, string>()

export const findShortsDataFromHTML = (html: string, shortsId: string): { title?: string; uploader?: string } => {
  const data = findUploaderAndTitleInJSONText(html, shortsId)
  if (data.title || data.uploader) return data

  const title = cleanTitle(textFromHTML(html, "yt-shorts-video-title-view-model .ytAttributedStringHost")
    || textFromHTML(html, ".ytp-title-link")
    || html.match(/<title>([^<]+)<\/title>/)?.[1])

  const uploader = cleanUploader(textFromHTML(html, "yt-reel-channel-bar-view-model .ytReelChannelBarViewModelChannelName a")
    || textFromHTML(html, "yt-reel-channel-bar-view-model .ytAttributedStringHost a")
    || decodeHtml(html.match(/<a\b[^>]*href="\/(@[^"/]+)\/shorts"[^>]*>(.*?)<\/a>/i)?.[2] || "")
    || html.match(/href="\/(@[^"/]+)\/shorts"/i)?.[1]
    || decodeHtml(html.match(/aria-label="(?:Accéder|AccÃ©der|Go) [^"]*?cha(?:î|Ã®|i)ne ([^"]+)"/i)?.[1] || ""))

  return { title, uploader }
}

export const fetchShortsPageData = (shortsId: string): Promise<{ title?: string; uploader?: string }> => {
  const cached = shortsPageDataCache.get(shortsId)
  if (cached) return cached

  const request = fetch(new URL(`/shorts/${encodeURIComponent(shortsId)}`, location.origin).toString(), { credentials: "include" })
    .then(async (response) => {
      if (!response.ok) return {}
      return findShortsDataFromHTML(await response.text(), shortsId)
    })
    .catch(() => ({}))

  shortsPageDataCache.set(shortsId, request)
  return request
}

export const fetchShortsOEmbedData = (shortsId: string): Promise<{ title?: string; uploader?: string }> => {
  const cached = shortsOEmbedDataCache.get(shortsId)
  if (cached) return cached

  const params = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${shortsId}`,
    format: "json",
  })

  const request = fetch(`https://www.youtube.com/oembed?${params.toString()}`, { credentials: "omit" })
    .then(async (response) => {
      if (!response.ok) return {}
      const data = await response.json() as { title?: string; author_name?: string }
      return {
        title: cleanTitle(data.title),
        uploader: cleanUploader(data.author_name),
      }
    })
    .catch(() => ({}))

  shortsOEmbedDataCache.set(shortsId, request)
  return request
}

export const findUploaderAndTitleInJSONText = (text: string, shortsId: string): { title?: string; uploader?: string } => {
  for (const marker of ["ytInitialPlayerResponse", "ytInitialData", "ytInitialReelWatchSequenceResponse"]) {
    const data = parseJSONScript(text, marker)
    if (!data) continue

    const found = findUploaderAndTitleInJSON(data, shortsId)
    if (found.title || found.uploader) return found
  }

  return {}
}

export const findUploaderAndTitleInJSON = (data: unknown, shortsId: string): { title?: string; uploader?: string } => {
  const visit = (value: unknown): { title?: string; uploader?: string } => {
    if (!isRecord(value)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = visit(item)
          if (found.title || found.uploader) return found
        }
      }
      return {}
    }

    const videoDetails = value.videoDetails
    if (isRecord(videoDetails) && videoDetails.videoId === shortsId) {
      return {
        title: extractTitleValue(videoDetails.title),
        uploader: extractTextValue(videoDetails.author),
      }
    }

    const contentId = typeof value.videoId === "string" ? value.videoId : typeof value.contentId === "string" ? value.contentId : undefined
    const watchEndpoint = isRecord(value.watchEndpoint) ? value.watchEndpoint : undefined
    const endpointVideoId = typeof watchEndpoint?.videoId === "string" ? watchEndpoint.videoId : undefined
    const isCurrentVideo = contentId === shortsId || endpointVideoId === shortsId

    if (isCurrentVideo) {
      let title: string | undefined
      let uploader: string | undefined

      for (const [key, child] of Object.entries(value)) {
        if (!title && /title|headline|name/i.test(key)) title = extractTitleValue(child)
        if (!uploader && /author|byline|channel|owner|uploader/i.test(key)) uploader = extractTextValue(child)
      }

      if (title || uploader) return { title, uploader }
    }

    for (const child of Object.values(value)) {
      const found = visit(child)
      if (found.title || found.uploader) return found
    }

    return {}
  }

  return visit(data)
}

export const findUploaderInJSON = (data: unknown, shortsId?: string): string | undefined => {
  const visit = (value: unknown): string | undefined => {
    if (!isRecord(value)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = visit(item)
          if (found) return found
        }
      }
      return undefined
    }

    const videoDetails = value.videoDetails
    if (isRecord(videoDetails) && (!shortsId || videoDetails.videoId === shortsId)) {
      const author = extractTextValue(videoDetails.author)
      if (author) return author
    }

    const contentId = typeof value.videoId === "string" ? value.videoId : typeof value.contentId === "string" ? value.contentId : undefined
    if (shortsId && contentId && contentId !== shortsId) return undefined

    for (const [key, child] of Object.entries(value)) {
      if (/author|byline|channel|owner|uploader/i.test(key)) {
        const text = extractTextValue(child)
        if (text) return text
      }
    }

    for (const child of Object.values(value)) {
      const found = visit(child)
      if (found) return found
    }

    return undefined
  }

  return visit(data)
}

export const findUploaderFromData = (shortsId?: string): string | undefined => {
  const candidates: string[] = []

  for (const script of document.querySelectorAll<HTMLScriptElement>("script:not([src])")) {
    const text = script.textContent || ""
    if (!text.includes("author") && !text.includes("channel") && !text.includes("owner")) continue

    for (const marker of ["ytInitialPlayerResponse", "ytInitialData"]) {
      const data = parseJSONScript(text, marker)
      if (!data) continue

      const found = findUploaderInJSON(data, shortsId)
      if (found) candidates.push(found)
    }
  }

  if (candidates.length) return candidates[0]

  try {
    const ld = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]')
    if (ld?.textContent) {
      const data = JSON.parse(ld.textContent)
      const item = Array.isArray(data) ? data[0] : data
      const jsonLdVideoId = typeof item?.embedUrl === "string" ? item.embedUrl.split("/embed/")[1]?.split(/[?&/]/)[0] : undefined
      if (shortsId && jsonLdVideoId !== shortsId && item?.["@id"] !== `https://www.youtube.com/watch?v=${shortsId}`) return undefined
      return extractTextValue(item?.author)
    }
  } catch {}
  return undefined
}

export const findUploaderFromMeta = (): string | undefined => {
  const el = document.querySelector('meta[itemprop="author"]')
  if (el) {
    const attr = el.getAttribute("href") || el.getAttribute("content")
    if (attr) return attr.startsWith("/@") ? attr.slice(2) : attr
  }
  const twitterCreator = document.querySelector('meta[name="twitter:creator"]')
  if (twitterCreator) {
    const content = twitterCreator.getAttribute("content")
    if (content) return content.startsWith("@") ? content.slice(1) : content
  }
  const ogSite = document.querySelector('meta[property="og:site_name"]')
  if (ogSite) {
    const content = ogSite.getAttribute("content")
    if (content && content !== "YouTube") return content
  }
  return undefined
}
