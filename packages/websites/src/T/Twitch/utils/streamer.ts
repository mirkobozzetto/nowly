export const findStreamTitle = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-title"]',
    ".stream-info-card p a",
    ".channel-info-content h2",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

export const findStreamerName = (): string | undefined => {
  const selectors = [
    '[data-a-target="streamer-name"]',
    '[data-a-target="channel-name"]',
    '[data-a-target="watch-party-channel-name"]',
    ".channel-info-content h1",
    ".channel-root__info h1",
    '[class*="channel-header"] h1',
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  const avatarName = findStreamerAvatarAlt()
  if (avatarName) return avatarName

  const channelLink = document.querySelector<HTMLAnchorElement>(
    'a[data-a-target="streamer-name"], main a[href^="/"][href]:not([href*="/videos/"]):not([href*="/directory/"])',
  )
  const channelName = channelLink?.textContent?.trim() || channelLink?.pathname.replace("/", "").trim()
  return channelName || undefined
}

export const findGame = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-game-link"]',
    ".stream-info-card [data-a-target='stream-game-link']",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

export const findStreamerAvatar = (streamerName?: string): string | undefined => {
  const selectors = [
    ".channel-info-content img.tw-image-avatar",
    "[data-a-target='user-avatar'] img.tw-image-avatar",
    "[data-a-target='user-avatar'] img",
    "[data-a-target='channel-avatar'] img",
    "[data-a-target='streamer-avatar'] img",
    "a[data-a-target='streamer-name'] img",
    "[class*='channel-header'] img.tw-image-avatar[src*='profile_image']",
    "main img.tw-image-avatar[src*='profile_image']",
    "main img[src*='profile_image']",
    "img.tw-image-avatar[src*='profile_image']",
  ] as const

  for (const selector of selectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    if (img?.src?.includes("profile_image")) return upscaleAvatar(img.src)
  }

  if (streamerName) {
    const byAlt = findAvatarByName(streamerName)
    if (byAlt?.src) return upscaleAvatar(byAlt.src)
  }

  const metaImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content
  if (metaImage?.includes("profile_image")) return upscaleAvatar(metaImage)

  return undefined
}

const findStreamerAvatarAlt = (): string | undefined => {
  const img = document.querySelector<HTMLImageElement>(
    "main img[src*='profile_image'], img.tw-image-avatar[src*='profile_image']",
  )
  return img?.alt?.trim() || undefined
}

const findAvatarByName = (streamerName: string): HTMLImageElement | null => {
  const normalizedStreamerName = normalizeName(streamerName)
  const avatars = document.querySelectorAll<HTMLImageElement>(
    "img[src*='profile_image'], img.tw-image-avatar",
  )

  for (const avatar of avatars) {
    const label = avatar.alt || avatar.getAttribute("aria-label") || ""
    if (normalizeName(label) === normalizedStreamerName) return avatar
  }

  return null
}

const normalizeName = (value: string): string => value.trim().toLocaleLowerCase()

const upscaleAvatar = (url: string): string =>
  url.replace(/-\d+x\d+\.(png|jpe?g)(\?.*)?$/, "-300x300.$1$2")
