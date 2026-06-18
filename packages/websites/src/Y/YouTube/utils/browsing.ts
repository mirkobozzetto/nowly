import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"
import { Category } from "./categories"
import { $, text } from "./dom"
import { getChannelAvatar, getChannelName, getChannelSubscribers } from "./channel"

type YouTubeBrowsingSettings = {
  showChannels?: unknown
}

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  settings: YouTubeBrowsingSettings,
): Promise<void> => {
  const { pathname, search } = document.location

  if (pathname === "/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ" || pathname === "/@youtubemusic") {
    await presence.setActivity({
      details: "Browsing YouTube Music",
      largeImageKey: Category.Music,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/channel/UC4R8DWoMoI7CAwX8_LjQHig") {
    await presence.setActivity({
      details: "Browsing YouTube Live",
      largeImageKey: Category.Live,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/channel/UCrpQ4p1Ql_hG8rKXIKM1MOQ") {
    await presence.setActivity({
      details: "Browsing YouTube Fashion",
      largeImageKey: Category.Fashion,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/@") || pathname.startsWith("/channel/")) {
    if (settings.showChannels) {
      const channelName = getChannelName()
      const avatar = getChannelAvatar()
      const subscribers = getChannelSubscribers()

      await presence.setActivity({
        details: channelName || "Viewing channel",
        state: subscribers,
        largeImageKey: avatar || Assets.Logo,
        largeImageText: channelName || "YouTube",
        type: PresenceType.Watching,
      })
    } else {
      await presence.setActivity({
        details: "Viewing channel",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
    }
    return
  }

  if (pathname === "/" || pathname === "/feed/trending") {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/results")) {
    const query = new URLSearchParams(search).get("search_query")
    await presence.setActivity({
      details: "Searching",
      state: query ? `"${query}"` : undefined,
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/subscriptions")) {
    await presence.setActivity({
      details: "Browsing subscriptions",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/history")) {
    await presence.setActivity({
      details: "Viewing history",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/playlists")) {
    await presence.setActivity({
      details: "Browsing playlists",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/you")) {
    await presence.setActivity({
      details: "Browsing your feed",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/storefront")) {
    await presence.setActivity({
      details: "Browsing movies & TV",
      largeImageKey: Category.Storefront,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/gaming")) {
    await presence.setActivity({
      details: "Browsing gaming",
      largeImageKey: Category.Gaming,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/podcasts")) {
    await presence.setActivity({
      details: "Browsing podcasts",
      largeImageKey: Category.Podcasts,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/playables")) {
    await presence.setActivity({
      details: "Playing games",
      largeImageKey: Category.Playables,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/feed/courses_destination")) {
    await presence.setActivity({
      details: "Browsing courses",
      largeImageKey: Category.Courses,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/playlist")) {
    const list = new URLSearchParams(search).get("list")
    let playlistName = "Viewing playlist"
    if (list === "WL") playlistName = "Watch Later"
    else if (list === "LL") playlistName = "Liked videos"

    await presence.setActivity({
      details: playlistName,
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  await presence.setActivity({
    details: "Browsing",
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
}
