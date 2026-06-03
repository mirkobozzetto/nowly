import { cleanUploader, cleanTitle } from "./text"
import { findVideo, queryDeepAll, queryDeep, isVisible } from "./dom"
import { queryPageWorld } from "./bridge"
import { fetchShortsPageData, fetchShortsOEmbedData, findUploaderFromData, findUploaderFromMeta, shortsUploaderCache } from "./youtube-data"
import { findShortsTitleFromDOM, findUploaderFromShortsDOM, getShortsHandleLinks, findVisibleShortsMetapanel, findShortsReel } from "./shorts-dom"

export const shortsDebugged = new Set<string>()

const dumpPageTexts = (shortsId: string): void => {
  try {
    const lines: string[] = []
    lines.push(`=== PAGE DUMP [${shortsId}] ===`)
    lines.push(`document.title: ${document.title}`)

    lines.push(`--- All a[href^='/@'] ---`)
    const links = document.querySelectorAll<HTMLAnchorElement>("a[href^='/@']")
    lines.push(`  count: ${links.length}`)
    for (const link of links) {
      const href = link.getAttribute("href") || ""
      const text = (link.textContent || "").trim().slice(0, 100)
      const visible = isVisible(link)
      lines.push(`  ${href} "${text}" visible=${visible} rect=${JSON.stringify(link.getBoundingClientRect())}`)
    }

    lines.push(`--- All a[href*='/shorts/'] ---`)
    for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href*='/shorts/']")) {
      const href = link.getAttribute("href") || ""
      const text = (link.textContent || "").trim().slice(0, 100)
      lines.push(`  ${href} "${text}"`)
    }

    lines.push(`--- document.title ---`)
    lines.push(`  ${document.title}`)

    lines.push(`--- meta[itemprop="author"] ---`)
    const authorMeta = document.querySelector('meta[itemprop="author"]')
    if (authorMeta) lines.push(`  href=${authorMeta.getAttribute("href")} content=${authorMeta.getAttribute("content")}`)
    else lines.push(`  NOT FOUND`)

    lines.push(`--- meta[name="twitter:creator"] ---`)
    const twitterMeta = document.querySelector('meta[name="twitter:creator"]')
    if (twitterMeta) lines.push(`  content=${twitterMeta.getAttribute("content")}`)
    else lines.push(`  NOT FOUND`)

    lines.push(`--- All meta tags ---`)
    for (const meta of document.querySelectorAll("meta")) {
      const name = meta.getAttribute("name") || meta.getAttribute("property") || ""
      const content = meta.getAttribute("content") || ""
      if (content) lines.push(`  ${name} = ${content}`)
    }

    lines.push(`--- All @handles in innerHTML ---`)
    const handles = document.body.innerHTML.match(/@[A-Za-z0-9._-]+/g)
    if (handles) {
      for (const h of [...new Set(handles)].slice(0, 30)) lines.push(`  ${h}`)
    }

    lines.push(`--- All text from elements with 'channel' in className/id ---`)
    for (const el of document.querySelectorAll<HTMLElement>("[class*='channel' i], [id*='channel' i]")) {
      const t = (el.textContent || "").trim().slice(0, 120)
      if (t) lines.push(`  ${el.tagName}.${el.className.slice(0, 40)} = "${t}"`)
    }

    lines.push(`--- ytInitialPlayerResponse author ---`)
    const ytData = (window as any).ytInitialPlayerResponse
    if (ytData?.videoDetails?.author) lines.push(`  ${ytData.videoDetails.author}`)
    else lines.push(`  NOT FOUND`)

    const output = lines.join("\n")
    console.log(output)
    console.log("=== END PAGE DUMP ===")
  } catch (err) {
    console.error("dumpPageTexts error:", err)
  }
}

export const debugMissingShortsUploader = async (shortsId: string, title: string | undefined, presenceInstance: { info: (msg: string) => void }): Promise<void> => {
  if (shortsDebugged.has(shortsId)) return
  shortsDebugged.add(shortsId)

  const bridge = await queryPageWorld(shortsId)
  const video = findVideo()
  const players = Array.from(document.querySelectorAll("#shorts-player, #movie_player, .html5-video-player"))
    .map((player) => {
      const el = player as HTMLElement & { getPlayerResponse?: unknown }
      return `${el.id || el.className}:${typeof el.getPlayerResponse}`
    })
    .join(", ")

  const reel = findShortsReel(shortsId)
  const domUploader = findUploaderFromShortsDOM(shortsId, title)
  const pageData = await fetchShortsPageData(shortsId)
  const handleLinks = getShortsHandleLinks()
  const visibleHandleLinks = handleLinks.filter(isVisible)
  const metapanels = queryDeepAll<HTMLElement>(document.documentElement, "yt-reel-metapanel-view-model")
  const visibleMetapanel = findVisibleShortsMetapanel(title)
  const handleSamples = visibleHandleLinks
    .slice(0, 3)
    .map((link) => cleanUploader(link.textContent?.trim()) || link.getAttribute("href") || "empty")
    .join(", ")
  const panelSample = visibleMetapanel?.textContent?.replace(/\s+/g, " ").trim().slice(0, 180)

  dumpPageTexts(shortsId)

  presenceInstance.info([
    `Shorts uploader missing for ${shortsId}`,
    `title=${title || "none"}`,
    `bridge=${bridge.videoId || "none"}/${bridge.author || "no-author"}`,
    `players=${players || "none"}`,
    `video=${video ? `${video.tagName}:${Math.round(video.currentTime || 0)}/${Math.round(video.duration || 0)}` : "no"}`,
    `reel=${reel ? "yes" : "no"}`,
    `metapanels=${metapanels.length}${visibleMetapanel ? "/visible" : "/none"}`,
    `handles=${handleLinks.length}/${visibleHandleLinks.length}${handleSamples ? ` ${handleSamples}` : ""}`,
    `panel=${panelSample || "none"}`,
    `dom=${domUploader || "none"}`,
    `page=${pageData.uploader || "none"}`,
  ].join(" | "))
}

const isLikelyTitle = (value: string | undefined): value is string =>
  !!value && value.length > 1 && value.length < 200

export const resolveShortsTitle = async (shortsId: string, previousTitle: string, retries = 12, delay = 300): Promise<string | undefined> => {
  for (let i = 0; i < retries; i++) {
    const oEmbedData = await fetchShortsOEmbedData(shortsId)
    if (isLikelyTitle(oEmbedData.title)) return oEmbedData.title

    const bridge = await queryPageWorld(shortsId)
    if (bridge.videoId === shortsId) {
      const bridgeTitle = cleanTitle(bridge.title)
      if (isLikelyTitle(bridgeTitle)) return bridgeTitle
    }

    const pageData = await fetchShortsPageData(shortsId)
    if (isLikelyTitle(pageData.title)) return pageData.title

    const domTitle = findShortsTitleFromDOM(shortsId)
    if (isLikelyTitle(domTitle)) return domTitle

    await new Promise((r) => setTimeout(r, delay))
  }

  const domTitle = findShortsTitleFromDOM(shortsId)
  if (isLikelyTitle(domTitle)) return domTitle

  const pageData = await fetchShortsPageData(shortsId)
  if (isLikelyTitle(pageData.title)) return pageData.title

  const documentTitle = cleanTitle(document.title)
  if (documentTitle !== previousTitle && isLikelyTitle(documentTitle)) return documentTitle

  return undefined
}

const isValidUploader = (value: string | undefined): value is string =>
  !!value && value.length < 80 && !value.includes("#") && !value.includes("http")

const hasHandle = (value: string | undefined): value is string =>
  isValidUploader(value) && value.includes("@")

export const resolveShortsUploader = async (shortsId: string, title?: string, retries = 8, delay = 300): Promise<string | undefined> => {
  let lastValid: string | undefined

  for (let i = 0; i < retries; i++) {
    const candidates: Array<string | undefined> = []

    const directLink = document.querySelector<HTMLAnchorElement>("a[href^='/@'][href*='/shorts']")
    const directHandle = directLink
      ? cleanUploader(directLink.getAttribute("href")?.match(/\/(@[^/?#]+)/)?.[1])
      : undefined
    candidates.push(directHandle)

    const domUploader = cleanUploader(findUploaderFromShortsDOM(shortsId, title))
    candidates.push(domUploader)

    const oEmbedData = await fetchShortsOEmbedData(shortsId)
    candidates.push(cleanUploader(oEmbedData.uploader))

    const bridge = await queryPageWorld(shortsId)
    if (bridge.videoId === shortsId) {
      candidates.push(cleanUploader(bridge.author))
    }

    const pageData = await fetchShortsPageData(shortsId)
    candidates.push(cleanUploader(pageData.uploader))

    const inlineUploader = cleanUploader(findUploaderFromData(shortsId))
    candidates.push(inlineUploader)

    const withHandle = candidates.find(hasHandle)
    if (withHandle) {
      shortsUploaderCache.set(shortsId, withHandle)
      return withHandle
    }

    lastValid = candidates.find(isValidUploader)
    await new Promise((r) => setTimeout(r, delay))
  }

  if (lastValid) return lastValid

  const metaUploader = cleanUploader(findUploaderFromMeta())
  if (isValidUploader(metaUploader)) return metaUploader

  return undefined
}
