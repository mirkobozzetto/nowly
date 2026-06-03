import { cleanUploader, cleanTitle } from "./text"
import { queryDeep, queryDeepAll, closestDeep, closestByTagName, isVisible, firstVisibleDescendant, findVideo } from "./dom"

export const shortsUploaderSelectors = [
  "yt-reel-channel-bar-view-model .ytReelChannelBarViewModelChannelName a",
  "yt-reel-channel-bar-view-model .ytAttributedStringHost a",
  "yt-reel-channel-bar-view-model [aria-label*='chaîne']",
  "yt-reel-channel-bar-view-model [aria-label*='channel']",
  ".ytReelChannelBarViewModelChannelName a",
  "yt-formatted-string#text.style-scope.ytd-channel-name",
  "yt-formatted-string#text.style-scope.ytd-channel-name a",
  "ytd-reel-player-overlay-renderer ytd-channel-name a",
  "ytd-reel-video-renderer #channel-name a",
  ".ytAvatarStackViewModelAvatarStackText",
  "yt-avatar-stack-view-model .ytAttributedStringHost",
  "[aria-label^='Accéder à la chaîne']",
  "[aria-label^='Go to channel']",
  "a[href^='/@'][href*='/shorts']",
  "a[href^='/@']",
]

export const findUploaderInContainer = (container: Element): string | undefined => {
  for (const selector of shortsUploaderSelectors) {
    const el = queryDeep(container, selector)
    const label = cleanUploader(el?.textContent?.trim())
    if (label) return label

    const ariaLabel = cleanUploader(el?.getAttribute("aria-label") || undefined)
    if (ariaLabel) return ariaLabel
  }

  return undefined
}

export const findUploaderFromDOM = (): string | undefined => {
  const video = findVideo()
  if (!video) return undefined
  const reel = closestDeep<HTMLElement>(video, "ytd-reel-video-renderer")
  if (!reel) return undefined

  const selectors = [
    ".ytReelChannelBarViewModelChannelName a",
    ".ytAttributedStringHost a",
    "yt-formatted-string#text.style-scope.ytd-channel-name a",
    "ytd-channel-name a",
    "#channel-name a",
    "a[href^='/@']",
  ]
  for (const sel of selectors) {
    const el = queryDeep(reel, sel)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }
  return undefined
}

export const findShortsReel = (shortsId?: string): HTMLElement | null => {
  const activeVideoReel = closestDeep<HTMLElement>(findVideo(), "ytd-reel-video-renderer")
  if (activeVideoReel) return activeVideoReel

  const reels = queryDeepAll<HTMLElement>(document.documentElement, "ytd-reel-video-renderer")
  if (!reels.length) return null

  if (shortsId) {
    const matching = reels.find((reel) =>
      !!queryDeep(reel, `a[href*="/shorts/${CSS.escape(shortsId)}"], a[href*="watch?v=${CSS.escape(shortsId)}"]`),
    )
    if (matching) return matching
  }

  const activePlayer = queryDeep(document.documentElement, 'ytd-player[aria-hidden="false"]') as HTMLElement | null
  const activeReel = closestDeep<HTMLElement>(activePlayer, "ytd-reel-video-renderer")
  if (activeReel) return activeReel

  return reels
    .filter((reel) => {
      const rect = reel.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0
    })
    .sort((a, b) => {
      const center = window.innerHeight / 2
      return Math.abs(a.getBoundingClientRect().top - center) - Math.abs(b.getBoundingClientRect().top - center)
    })[0] || reels[0]
}

export const ancestorContainsCurrentShort = (element: Element, shortsId?: string, title?: string): boolean => {
  let current: Element | null = element
  const normalizedTitle = cleanTitle(title)

  for (let depth = 0; current && depth < 10; depth++) {
    if (shortsId && current.querySelector(`a[href*="/shorts/${CSS.escape(shortsId)}"]`)) return true
    if (normalizedTitle && current.textContent?.includes(normalizedTitle)) return true
    current = current.parentElement
  }

  return false
}

export const getShortsHandleLinks = (): HTMLAnchorElement[] =>
  queryDeepAll<HTMLAnchorElement>(document.documentElement, [
    "a[href^='/@'][href*='/shorts']",
    "a[href*='youtube.com/@'][href*='/shorts']",
    "a[href*='/@'][href*='/shorts']",
    ".ytReelChannelBarViewModelChannelName a[href*='@']",
    "yt-reel-channel-bar-view-model a[href*='@']",
    "a[href^='/@']",
    "a[href*='youtube.com/@']",
  ].join(","))
    .filter((link, index, links) => links.indexOf(link) === index)

export const getAccessibleShortsHandleLinks = (): HTMLAnchorElement[] =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>([
    "a[href^='/@'][href*='/shorts']",
    "a[href*='youtube.com/@'][href*='/shorts']",
  ].join(",")))
    .filter((link, index, links) => links.indexOf(link) === index)

export const extractHandleFromElement = (element: Element): string | undefined => {
  const href = element.getAttribute("href") || (element as HTMLAnchorElement).href || ""
  const hrefHandle = href.match(/\/(@[^/?#]+)/)?.[1]
  if (hrefHandle) return cleanUploader(hrefHandle)

  const ariaHandle = element.getAttribute("aria-label")?.match(/@[A-Za-z0-9._-]+/)?.[0]
  if (ariaHandle) return cleanUploader(ariaHandle)

  const text = element.textContent?.replace(/\s+/g, " ").trim()
  const exactTextHandle = text?.match(/^@[A-Za-z0-9._-]+$/)?.[0]
  if (exactTextHandle) return cleanUploader(exactTextHandle)

  return undefined
}

export const getShortsHandleCandidates = (): Array<{ element: Element; uploader: string }> => {
  const elements = queryDeepAll(document.documentElement, [
    "a[href^='/@']",
    "a[href*='youtube.com/@']",
    "[aria-label*='@']",
    "yt-reel-channel-bar-view-model .ytAttributedStringHost",
    ".ytReelChannelBarViewModelChannelName",
    "yt-formatted-string#text.style-scope.ytd-channel-name",
    "span.ytAttributedStringHost",
  ].join(","))

  const seen = new Set<Element>()
  const candidates: Array<{ element: Element; uploader: string }> = []

  for (const element of elements) {
    if (seen.has(element)) continue
    seen.add(element)

    const uploader = extractHandleFromElement(element)
    if (uploader) candidates.push({ element, uploader })
  }

  return candidates
}

export const findUploaderFromAccessibleShortsLinks = (title?: string): string | undefined => {
  const links = getAccessibleShortsHandleLinks()
  if (!links.length) return undefined

  const normalizedTitle = cleanTitle(title)
  if (normalizedTitle) {
    const contextualLink = links.find((link) => ancestorContainsCurrentShort(link, undefined, normalizedTitle))
    const contextualUploader = contextualLink ? extractHandleFromElement(contextualLink) : undefined
    if (contextualUploader) return contextualUploader
  }

  const visibleLinks = links.filter(isVisible)
  const titleEl = findVisibleShortsTitleElement(title)

  if (visibleLinks.length && titleEl) {
    const titleRect = titleEl.getBoundingClientRect()
    const titleCenterY = titleRect.top + titleRect.height / 2
    const titleCenterX = titleRect.left + titleRect.width / 2

    const closest = visibleLinks
      .map((link) => {
        const rect = link.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const centerX = rect.left + rect.width / 2

        return {
          link,
          score: Math.abs(centerY - titleCenterY)
            + Math.abs(centerX - titleCenterX) / 4
            + (centerY <= titleCenterY ? 0 : 500),
        }
      })
      .sort((a, b) => a.score - b.score)[0]?.link

    const uploader = closest ? extractHandleFromElement(closest) : undefined
    if (uploader) return uploader
  }

  const firstVisibleUploader = visibleLinks
    .map(extractHandleFromElement)
    .find(Boolean)
  if (firstVisibleUploader) return firstVisibleUploader

  return extractHandleFromElement(links[0])
}

export const findVisibleShortsTitleElement = (title?: string): Element | undefined => {
  const normalizedTitle = cleanTitle(title)

  const candidates = queryDeepAll(document.documentElement, [
    "yt-shorts-video-title-view-model .ytAttributedStringHost",
    ".ytShortsVideoTitleViewModelShortsVideoTitle .ytAttributedStringHost",
    ".ytp-title-link",
    "yt-page-header-view-model h1",
  ].join(","))

  if (!normalizedTitle) {
    return candidates
      .filter((el) => isVisible(el) && !!cleanTitle(el.textContent?.trim()))
      .sort((a, b) => {
        const center = window.innerHeight / 2
        return Math.abs(a.getBoundingClientRect().top - center) - Math.abs(b.getBoundingClientRect().top - center)
      })[0]
  }

  return candidates.find((el) => isVisible(el) && cleanTitle(el.textContent?.trim()) === normalizedTitle)
    || candidates.find((el) => isVisible(el) && !!cleanTitle(el.textContent?.trim())?.includes(normalizedTitle))
}

export const findVisibleShortsMetapanel = (title?: string): HTMLElement | undefined => {
  const normalizedTitle = cleanTitle(title)
  const panels = queryDeepAll<HTMLElement>(document.documentElement, "yt-reel-metapanel-view-model")

  if (!panels.length) {
    return closestByTagName(findVisibleShortsTitleElement(title) || findVisibleShortsTitleElement(), "yt-reel-metapanel-view-model")
  }

  if (normalizedTitle) {
    const matchingPanel = panels.find((panel) => {
      const titleElements = queryDeepAll(panel, [
        "yt-shorts-video-title-view-model .ytAttributedStringHost",
        ".ytShortsVideoTitleViewModelShortsVideoTitle .ytAttributedStringHost",
      ].join(","))

      return titleElements.some((el) =>
        isVisible(el)
        && !!cleanTitle(el.textContent?.trim())?.includes(normalizedTitle),
      )
    })
    if (matchingPanel) return matchingPanel
  }

  return panels
    .filter((panel) => !!firstVisibleDescendant(panel, [
      "yt-reel-channel-bar-view-model a[href^='/@']",
      "yt-reel-channel-bar-view-model [aria-label*='chaîne']",
      "yt-reel-channel-bar-view-model [aria-label*='channel']",
      "yt-shorts-video-title-view-model .ytAttributedStringHost",
      ".ytShortsVideoTitleViewModelShortsVideoTitle .ytAttributedStringHost",
    ].join(",")))
    .sort((a, b) => {
      const center = window.innerHeight / 2
      const aRect = firstVisibleDescendant(a)?.getBoundingClientRect() ?? a.getBoundingClientRect()
      const bRect = firstVisibleDescendant(b)?.getBoundingClientRect() ?? b.getBoundingClientRect()
      return Math.abs(aRect.top - center) - Math.abs(bRect.top - center)
    })[0]
}

export const findClosestVisibleHandle = (title?: string): HTMLAnchorElement | undefined => {
  const handles = getShortsHandleLinks().filter(isVisible)

  if (!handles.length) return undefined

  const titleEl = findVisibleShortsTitleElement(title)
  if (!titleEl) {
    const viewportCenter = window.innerHeight / 2
    return handles
      .map((handle) => {
        const rect = handle.getBoundingClientRect()
        return { handle, score: Math.abs((rect.top + rect.height / 2) - viewportCenter) }
      })
      .sort((a, b) => a.score - b.score)[0]?.handle
  }

  const titleRect = titleEl.getBoundingClientRect()
  const titleCenter = titleRect.top + titleRect.height / 2

  return handles
    .map((handle) => {
      const rect = handle.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const isAboveTitle = center <= titleCenter
      return {
        handle,
        score: Math.abs(center - titleCenter) + (isAboveTitle ? 0 : 500),
      }
    })
    .sort((a, b) => a.score - b.score)[0]?.handle
}

export const findClosestVisibleHandleCandidate = (title?: string): string | undefined => {
  const candidates = getShortsHandleCandidates().filter(({ element }) => isVisible(element))
  if (!candidates.length) return undefined

  const titleEl = findVisibleShortsTitleElement(title)
  if (!titleEl) {
    const viewportCenter = window.innerHeight / 2
    return candidates
      .map((candidate) => {
        const rect = candidate.element.getBoundingClientRect()
        return { ...candidate, score: Math.abs((rect.top + rect.height / 2) - viewportCenter) }
      })
      .sort((a, b) => a.score - b.score)[0]?.uploader
  }

  const titleRect = titleEl.getBoundingClientRect()
  const titleCenterY = titleRect.top + titleRect.height / 2
  const titleCenterX = titleRect.left + titleRect.width / 2

  return candidates
    .map((candidate) => {
      const rect = candidate.element.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const centerX = rect.left + rect.width / 2
      const isAboveTitle = centerY <= titleCenterY

      return {
        ...candidate,
        score: Math.abs(centerY - titleCenterY)
          + Math.abs(centerX - titleCenterX) / 4
          + (isAboveTitle ? 0 : 500),
      }
    })
    .sort((a, b) => a.score - b.score)[0]?.uploader
}

export const findUploaderFromVisibleTitlePanel = (title?: string): string | undefined => {
  const normalizedTitle = cleanTitle(title)
  const panels = queryDeepAll<HTMLElement>(document.documentElement, "yt-reel-metapanel-view-model")

  for (const panel of panels) {
    const titleElements = queryDeepAll(panel, [
      "yt-shorts-video-title-view-model .ytAttributedStringHost",
      ".ytShortsVideoTitleViewModelShortsVideoTitle .ytAttributedStringHost",
    ].join(","))

    const hasCurrentTitle = titleElements.some((el) => {
      const panelTitle = cleanTitle(el.textContent?.trim())
      if (!panelTitle) return false
      if (!normalizedTitle) return isVisible(el)
      return panelTitle === normalizedTitle || panelTitle.includes(normalizedTitle) || normalizedTitle.includes(panelTitle)
    })

    if (!hasCurrentTitle) continue

    const handleElement = queryDeep(panel, [
      "yt-reel-channel-bar-view-model a[href^='/@']",
      "yt-reel-channel-bar-view-model a[href*='youtube.com/@']",
      ".ytReelChannelBarViewModelChannelName a[href^='/@']",
      ".ytReelChannelBarViewModelChannelName a[href*='youtube.com/@']",
      "a[href^='/@'][href*='/shorts']",
      "a[href^='/@']",
    ].join(","))

    const uploader = handleElement ? extractHandleFromElement(handleElement) : undefined
    if (uploader) return uploader

    const textHandle = panel.textContent?.match(/@[A-Za-z0-9._-]+/)?.[0]
    if (textHandle) return cleanUploader(textHandle)
  }

  return undefined
}

export const findUploaderFromShortsDOM = (shortsId?: string, title?: string): string | undefined => {
  const accessibleUploader = findUploaderFromAccessibleShortsLinks(title)
  if (accessibleUploader) return accessibleUploader

  const panelUploader = findUploaderFromVisibleTitlePanel(title)
  if (panelUploader) return panelUploader

  const visibleHandle = findClosestVisibleHandleCandidate(title)
  if (visibleHandle) return visibleHandle

  const visibleMetapanel = findVisibleShortsMetapanel(title)
  if (visibleMetapanel) {
    const uploader = findUploaderInContainer(visibleMetapanel)
    if (uploader) return uploader
  }

  const reel = findShortsReel(shortsId)
  if (reel && isVisible(reel)) {
    const uploader = findUploaderInContainer(reel)
    if (uploader) return uploader
  }

  const handleLinks = getShortsHandleLinks()
  const visibleHandles = handleLinks.filter(isVisible)

  const contextualHandle = visibleHandles.find((link) => ancestorContainsCurrentShort(link, shortsId, title))
    || handleLinks.find((link) => ancestorContainsCurrentShort(link, shortsId, title))
    || findClosestVisibleHandle(title)

  return cleanUploader(contextualHandle?.textContent?.trim())
    || cleanUploader(contextualHandle?.getAttribute("href")?.match(/^\/(@[^/]+)\/shorts$/)?.[1])
}

export const findShortsTitleFromDOM = (shortsId?: string): string | undefined => {
  const visibleTitle = cleanTitle(findVisibleShortsTitleElement()?.textContent?.trim())
  if (visibleTitle) return visibleTitle

  const reel = findShortsReel(shortsId)
  if (!reel) return undefined

  const selectors = [
    "yt-shorts-video-title-view-model .ytAttributedStringHost",
    ".ytShortsVideoTitleViewModelShortsVideoTitle .ytAttributedStringHost",
    ".ytp-title-link",
    "yt-page-header-view-model h1 .ytAttributedStringHost",
    "yt-page-header-view-model h1",
  ]

  for (const selector of selectors) {
    const el = queryDeep(reel, selector)
    const title = cleanTitle(el?.textContent?.trim() || el?.getAttribute("aria-label") || undefined)
    if (title) return title
  }

  return undefined
}
