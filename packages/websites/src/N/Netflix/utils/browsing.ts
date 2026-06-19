import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"

const findSearchQuery = (): string | undefined => {
  const fromUrl = new URLSearchParams(document.location.search).get("q")
  if (fromUrl) return fromUrl

  const input = document.querySelector<HTMLInputElement>('[data-uia="search-box-input"], input[type="search"]')
  return input?.value || undefined
}

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<void> => {
  if (pathname.includes("/search")) {
    const query = findSearchQuery()
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/latest")) {
    await presence.setActivity({
      details: "Browsing New & Popular",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/my-list")) {
    await presence.setActivity({
      details: "Browsing My List",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/browse/genre")) {
    await presence.setActivity({
      details: "Browsing a genre",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname === "/" || pathname.includes("/browse")) {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
}