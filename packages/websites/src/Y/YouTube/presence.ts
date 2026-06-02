import { createMediaTimestamps, PresenceType } from "@nowly/presence"

const settings = Presence.Settings({
  showBrowsing: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Show browsing activity",
      "fr-FR": "Afficher l'activité de navigation",
      "es-ES": "Mostrar actividad de navegación",
    },
    description: {
      "en-US": "When enabled, your presence will also show when browsing YouTube (home, search, subscriptions, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur YouTube (accueil, recherche, abonnements, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por YouTube (inicio, búsqueda, suscripciones, etc.), no solo al ver un vídeo.",
    },
  },
  showChannels: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Show channel details",
      "fr-FR": "Afficher les détails de la chaîne",
      "es-ES": "Mostrar detalles del canal",
    },
    description: {
      "en-US": "When enabled, your presence will show the channel name and avatar when viewing a channel page.",
      "fr-FR": "Quand activé, votre présence affichera le nom et l'avatar de la chaîne lorsque vous consultez une page chaîne.",
      "es-ES": "Cuando está activado, tu presencia mostrará el nombre y avatar del canal al ver una página de canal.",
    },
  },
})

const presence = new Presence(settings)

const $ = <T extends Element = Element>(selector: string, parent?: Element): T | null =>
  (parent ? parent.querySelector(selector) : document.querySelector(selector)) as T | null

const text = (el: Element | null | undefined): string | undefined =>
  el?.textContent?.trim() || undefined

const findVideo = (): HTMLVideoElement | null => {
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

  for (const root of document.querySelectorAll("ytd-player, ytd-watch-flexy")) {
    const video = root.shadowRoot?.querySelector<HTMLVideoElement>("video")
    if (video) return video
  }

  return null
}

const findTitle = (): string =>
  $("h1 yt-formatted-string")?.textContent?.trim()
  || $("h1")?.textContent?.trim()
  || document.title.replace(" - YouTube", "")
  || "YouTube"

const findUploader = (): string =>
  $("#owner yt-formatted-string a")?.textContent?.trim()
  || $(".ytd-channel-name a")?.textContent?.trim()
  || $("#owner-container a")?.textContent?.trim()
  || "YouTube"

const getChannelName = (): string | undefined => {
  const title = document.title.replace(" - YouTube", "").trim()
  return title || undefined
}

const getChannelAvatar = (): string | undefined => {
  const img = $<HTMLImageElement>("#page-header yt-img-shadow img, ytd-tabbed-page-header yt-img-shadow img, ytd-c4-header yt-img-shadow img")
  return img?.src || undefined
}

const getChannelSubscribers = (): string | undefined => {
  const el = $("#subscriber-count") ?? $("#owner-sub-count") ?? $("yt-formatted-string#subscriber-count")
  return text(el)
}

presence.on("UpdateData", async (ctx) => {
  const { pathname, href, search } = document.location
  const video = findVideo()
  const videoId = new URLSearchParams(search).get("v")

  if (video && videoId) {
    const title = findTitle()
    const isPlaying = !video.paused

    await presence.setActivity({
      details: title,
      state: findUploader(),
      largeImageKey: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
      largeImageText: title,
      smallImageKey: isPlaying ? "play" : "pause",
      smallImageText: isPlaying ? "Playing" : "Paused",
      ...createMediaTimestamps(video),
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Video", url: href.split("&")[0] }],
    })
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (pathname.startsWith("/@") || pathname.startsWith("/channel/")) {
    if (ctx.settings.showChannels) {
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
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/gaming")) {
    await presence.setActivity({
      details: "Browsing gaming",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/podcasts")) {
    await presence.setActivity({
      details: "Browsing podcasts",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/shorts")) {
    await presence.setActivity({
      details: "Watching shorts",
      largeImageKey: Assets.Logo,
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
})
