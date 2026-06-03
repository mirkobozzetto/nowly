export const SHADOW_ROOTS_KEY = "__nowlyYouTubePresenceShadowRoots"
export const SHADOW_CAPTURE_INSTALLED_KEY = "__nowlyYouTubePresenceShadowCaptureInstalled"

const getCapturedShadowRoots = (): ShadowRoot[] => {
  const record = window as unknown as Record<string, unknown>
  if (!Array.isArray(record[SHADOW_ROOTS_KEY])) record[SHADOW_ROOTS_KEY] = []
  return record[SHADOW_ROOTS_KEY] as ShadowRoot[]
}

const installShadowRootCapture = (): void => {
  const record = window as unknown as Record<string, unknown>
  if (record[SHADOW_CAPTURE_INSTALLED_KEY]) return
  record[SHADOW_CAPTURE_INSTALLED_KEY] = true

  const originalAttachShadow = Element.prototype.attachShadow
  Element.prototype.attachShadow = function(this: Element, init: ShadowRootInit): ShadowRoot {
    const root = originalAttachShadow.call(this, init)
    getCapturedShadowRoots().push(root)
    return root
  }
}

installShadowRootCapture()

export const queryDeep = (root: Element | ShadowRoot, selector: string): Element | null => {
  const found = root.querySelector(selector)
  if (found) return found
  for (const el of root.querySelectorAll("*")) {
    const sr = (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot
    if (sr) {
      const result = queryDeep(sr, selector)
      if (result) return result
    }
  }
  if (root === document.documentElement) {
    for (const sr of getCapturedShadowRoots()) {
      const result = queryDeep(sr, selector)
      if (result) return result
    }
  }
  return null
}

export const queryDeepAll = <T extends Element = Element>(root: Element | ShadowRoot, selector: string): T[] => {
  const results = new Set<T>()
  const visitedRoots = new Set<Element | ShadowRoot>()

  const visit = (currentRoot: Element | ShadowRoot) => {
    if (visitedRoots.has(currentRoot)) return
    visitedRoots.add(currentRoot)

    for (const found of currentRoot.querySelectorAll<T>(selector)) {
      results.add(found)
    }

    for (const el of currentRoot.querySelectorAll("*")) {
      const sr = (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot
      if (sr) visit(sr)
    }
  }

  visit(root)
  if (root === document.documentElement) {
    for (const sr of getCapturedShadowRoots()) visit(sr)
  }
  return Array.from(results)
}

export const closestDeep = <T extends Element = Element>(element: Element | null | undefined, selector: string): T | null => {
  let current: Element | null | undefined = element

  for (let depth = 0; current && depth < 40; depth++) {
    if (current.matches(selector)) return current as T
    if (current.parentElement) {
      current = current.parentElement
      continue
    }

    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
  }

  return null
}

export const closestByTagName = (element: Element | undefined, tagName: string): HTMLElement | undefined => {
  let current: Element | null | undefined = element
  const expected = tagName.toUpperCase()

  for (let depth = 0; current && depth < 12; depth++) {
    if (current.tagName === expected) return current as HTMLElement
    current = current.parentElement
  }

  return undefined
}

export const isVisible = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()
  return element.getClientRects().length > 0 && rect.top < window.innerHeight && rect.bottom > 0
}

export const firstVisibleDescendant = (element: Element, selector = "*"): Element | undefined =>
  queryDeepAll(element, selector).find(isVisible)

export const $ = <T extends Element = Element>(selector: string, parent?: Element): T | null =>
  (parent ? parent.querySelector(selector) : document.querySelector(selector)) as T | null

export const text = (el: Element | null | undefined): string | undefined =>
  el?.textContent?.trim() || undefined

export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".video-stream",
    "video.html5-main-video",
    "#movie_player video",
    "#player-container video",
    "#player video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  const deepVideo = queryDeepAll<HTMLVideoElement>(document.documentElement, selectors.join(","))
    .find((video) => video.duration || video.currentSrc || video.src)
  if (deepVideo) return deepVideo

  for (const root of document.querySelectorAll("ytd-player, ytd-watch-flexy")) {
    const video = root.shadowRoot?.querySelector<HTMLVideoElement>("video")
    if (video) return video
  }

  return null
}

export const resolve = async <T extends Element>(selector: string, retries = 12, delay = 500): Promise<T | null> => {
  for (let i = 0; i < retries; i++) {
    const el = document.querySelector<T>(selector)
    if (el) return el
    await new Promise((r) => setTimeout(r, delay))
  }
  return document.querySelector<T>(selector)
}

export const resolveTitle = async (currentTitle: string, retries = 12, delay = 500): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    const title = document.title.replace(/ - YouTube$/, "").trim()
    if (title && title !== "YouTube" && title !== currentTitle) return title
    await new Promise((r) => setTimeout(r, delay))
  }
  return document.title.replace(/ - YouTube$/, "").trim()
}
