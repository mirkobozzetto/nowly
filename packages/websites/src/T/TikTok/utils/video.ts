export const extractHandle = (container: Element): string | undefined => {
  const avatarLink = container.querySelector<HTMLAnchorElement>("[data-e2e=\"video-author-avatar\"]")
  if (!avatarLink) return undefined

  const href = avatarLink.getAttribute("href") || ""
  return href.split("?")[0]?.replace("/@", "") || undefined
}

export const extractVideoId = (video: HTMLVideoElement): string | undefined => {
  const wrapper = video.closest("[id^=\"xgwrapper\"]")
  return wrapper?.id?.split("-")?.[2]
}

export const extractVideoPagePath = (pathname: string): { handle: string; videoId: string } | undefined => {
  const match = pathname.match(/^\/@([^/]+)\/video\/(\d+)/)
  if (!match?.[1] || !match[2]) return undefined
  return { handle: match[1], videoId: match[2] }
}

export const extractNickname = (container: Element): string | undefined => {
  const avatarLink = container.querySelector<HTMLAnchorElement>("[data-e2e=\"video-author-avatar\"]")
  const img = avatarLink?.querySelector("img")
  const alt = img?.getAttribute("alt")
  if (alt) return alt

  const textEl = container.querySelector("[class*=\"DivCreatorInfoContainer\"] p")
  return textEl?.textContent?.trim() || undefined
}

export const extractSingleVideoAuthor = (): { handle?: string; nickname?: string } => {
  const avatarLink = document.querySelector<HTMLAnchorElement>("[data-e2e=\"video-author-avatar\"]")
  return {
    handle: avatarLink?.getAttribute("href")?.split("?")[0]?.replace("/@", ""),
    nickname: avatarLink?.querySelector("img")?.getAttribute("alt") ?? undefined,
  }
}

export const extractVideoDescription = (container?: Element | null): string | undefined => {
  const desc = container
    ? container.querySelector("[data-e2e=\"video-desc\"]")
    : document.querySelector("[data-e2e=\"video-desc\"]")
  return desc?.textContent?.trim() || undefined
}

export const extractPoster = (video?: HTMLVideoElement | null): string | undefined => {
  const feedSection = video?.closest("[data-e2e=\"feed-video\"]")
  const img = feedSection?.querySelector<HTMLImageElement>("picture img")
  const feedPoster = img?.currentSrc || img?.src || img?.getAttribute("src")
  if (feedPoster) return feedPoster

  if (video?.poster) return video.poster

  let el: HTMLElement | null = video?.parentElement ?? null
  for (let i = 0; i < 6 && el; i++) {
    const coverImg = el.querySelector<HTMLImageElement>("img:not([class*=\"Avatar\"])[src*=\"tiktokcdn\"]")
    if (coverImg) {
      return coverImg.currentSrc || coverImg.src || coverImg.getAttribute("src") || undefined
    }
    el = el.parentElement
  }

  const og = document.querySelector<HTMLMetaElement>("meta[property=\"og:image\"]")
  if (og?.content) return og.content

  const artwork = navigator.mediaSession.metadata?.artwork
  if (artwork && artwork.length > 0) {
    return artwork[artwork.length - 1].src
  }

  return undefined
}
