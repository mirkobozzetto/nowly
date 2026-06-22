import type { PresenceInstance } from "@nowly/presence"
import { PresenceType } from "@nowly/presence"
import { getCategory } from "./categories"
import { getDetailImage, getPageTitle, getSearchQuery } from "./player"

export const handleBrowsingActivity = async (
  presence: PresenceInstance,
  pathname: string,
): Promise<void> => {
  const category = getCategory(pathname)

  if (pathname === "/" || pathname === "") {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/recherche") || pathname.startsWith("/search")) {
    const query = getSearchQuery()
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/live")) {
    await presence.setActivity({
      details: "Browsing live TV",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (category) {
    await presence.setActivity({
      details: category.details,
      state: getPageTitle(),
      largeImageKey: category.image,
      largeImageText: category.imageText,
      type: PresenceType.Watching,
    })
  } else if (pathname.startsWith("/docs")) {
    await setCategoryActivity(presence, "Browsing documentaries", Assets.Logo)
  } else if (pathname.startsWith("/chaines")) {
    await setCategoryActivity(presence, "Browsing channels", Assets.Logo)
  } else if (pathname.startsWith("/streaming")) {
    await setCategoryActivity(presence, "Browsing streaming", Assets.Logo)
  } else if (/\/h\/\d+/i.test(pathname)) {
    const title = getPageTitle()
    await presence.setActivity({
      details: "Viewing a programme",
      state: title,
      largeImageKey: getDetailImage() || Assets.Logo,
      largeImageText: title || "CANAL+",
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
}

const setCategoryActivity = async (
  presence: PresenceInstance,
  details: string,
  image: string,
): Promise<void> => {
  await presence.setActivity({
    details,
    state: getPageTitle(),
    largeImageKey: getDetailImage() || image,
    largeImageText: "CANAL+",
    type: PresenceType.Watching,
  })
}