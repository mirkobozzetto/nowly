import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"
import { findCategoryImage, findCategoryName } from "./category"
import { isOnCategoryPage, isOnChannelPage, isOnFollowingPage } from "./dom"
import { findStreamerAvatar, findStreamerName } from "./streamer"

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<void> => {
  if (isOnChannelPage()) {
    const streamer = findStreamerName()
    const avatar = findStreamerAvatar(streamer)
    await presence.setActivity({
      details: streamer ? `Viewing ${streamer}` : "Viewing channel",
      state: "Browsing...",
      largeImageKey: avatar || Assets.Logo,
      largeImageText: streamer || "Twitch",
      smallImageKey: Assets.Logo,
      smallImageText: "Twitch",
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/directory" || pathname === "/directory/") {
    await presence.setActivity({
      details: "Browsing categories",
      largeImageKey: Assets.Logo,
      largeImageText: "Twitch",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/directory/")) {
    if (isOnCategoryPage()) {
      const category = findCategoryName()
      const categoryImage = findCategoryImage()
      await presence.setActivity({
        details: category ? `Browsing ${category}` : "Browsing category",
        largeImageKey: categoryImage || Assets.Logo,
        largeImageText: category || "Twitch",
        smallImageKey: Assets.Logo,
        smallImageText: "Twitch",
        type: PresenceType.Watching,
        buttons: [{ label: "View Category", url: window.location.href.split("?")[0] }],
      })
    } else if (isOnFollowingPage()) {
      await presence.setActivity({
        details: "Browsing followed channels",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
    } else {
      await presence.setActivity({
        details: "Browsing directory",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
    }
  } else if (pathname.includes("/search")) {
    const query = new URLSearchParams(window.location.search).get("term")
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/team/")) {
    const team = pathname.split("/").pop()
    await presence.setActivity({
      details: "Viewing team",
      state: team,
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/subscriptions")) {
    await presence.setActivity({
      details: "Viewing subscriptions",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/wallet")) {
    await presence.setActivity({
      details: "Viewing wallet",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/drops")) {
    await presence.setActivity({
      details: "Viewing Drops",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
}
