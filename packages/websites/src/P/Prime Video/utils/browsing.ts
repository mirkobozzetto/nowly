import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"
import { findSearchQuery } from "./player"

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<void> => {
  if (pathname.includes("/storefront") || pathname === "/") {
    await presence.setActivity({
      details: "Viewing Home",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/search/")) {
    const query = findSearchQuery()
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/movie")) {
    await presence.setActivity({
      details: "Viewing Movies",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/tv")) {
    await presence.setActivity({
      details: "Viewing TV-Series",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/sports")) {
    await presence.setActivity({
      details: "Viewing Sports",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/livetv")) {
    await presence.setActivity({
      details: "Viewing Live TV",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/categories")) {
    await presence.setActivity({
      details: "Viewing Categories",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/kids/")) {
    await presence.setActivity({
      details: "Viewing Movies for kids",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/genre/")) {
    await presence.setActivity({
      details: "Viewing Genres",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("shop")) {
    await presence.setActivity({
      details: "Browsing the store...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
}
