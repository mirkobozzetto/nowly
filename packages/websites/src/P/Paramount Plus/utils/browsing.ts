import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"
import { getOgTitle, getSearchQuery } from "./player"

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<void> => {
  if (pathname === "/" || pathname.startsWith("/home")) {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/search")) {
    const query = getSearchQuery()
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  }else if (pathname.startsWith("/my-list")) {
    const query = getSearchQuery()
    await presence.setActivity({
      details: "Browsing My List",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/shows/") || pathname.startsWith("/browse/")) {
    await presence.setActivity({
      details: "Viewing a show",
      state: getOgTitle(),
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/movies/")) {
    await presence.setActivity({
      details: "Viewing a movie",
      state: getOgTitle(),
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/collections/")) {
    await presence.setActivity({
      details: "Viewing a collection",
      state: getOgTitle(),
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/live-tv")) {
    await presence.setActivity({
      details: "Browsing Live TV",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/sports") || pathname.startsWith("/brands")) {
    await presence.setActivity({
      details: "Browsing",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
}
