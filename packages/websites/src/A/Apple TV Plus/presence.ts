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
      "en-US": "When enabled, your presence will also show when browsing Apple TV+ (home, search, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Apple TV+ (accueil, recherche, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Apple TV+ (inicio, búsqueda, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

const $ = (selector: string, parent?: Element): Element | null =>
  parent ? parent.querySelector(selector) : document.querySelector(selector)

const $$ = (selector: string): NodeListOf<Element> =>
  document.querySelectorAll(selector)

const text = (el: Element | null | undefined): string | undefined =>
  el?.textContent?.trim() || undefined

const findVideo = (): HTMLVideoElement | undefined => {
  return $("video") as HTMLVideoElement | undefined
}

const hasPlayerTabs = (): boolean => {
  return !!$(".video-player__tabs")
}

const getPageTitle = (): string | undefined => {
  const og = $<HTMLMetaElement>('meta[property="og:title"]')
  if (og?.content) return og.content.replace(/ – Apple TV\+$/, "").trim()
  const title = document.title.replace(/ – Apple TV\+$/, "").trim()
  return title || undefined
}

const getPageDescription = (): string | undefined => {
  const og = $<HTMLMetaElement>('meta[property="og:description"]')
  if (og?.content) return og.content
  const meta = $<HTMLMetaElement>('meta[name="description"]')
  return meta?.content || undefined
}

const getThumbnail = (): string | undefined => {
  const artwork = navigator.mediaSession.metadata?.artwork
  if (artwork && artwork.length > 0) {
    return artwork[artwork.length - 1].src
  }
  const og = $<HTMLMetaElement>('meta[property="og:image"]')
  return og?.content || undefined
}

const parseSubtitle = (subtitle: string) => {
  const parts = subtitle.split(/, | · | • /)
  const seasonRaw = parts[0]
  const episodeRaw = parts[1]
  const episodeTitle = parts.slice(2).join(", ") || undefined

  const seasonNum = seasonRaw ? parseInt(seasonRaw.replace(/^\D/, ""), 10) : undefined
  const episodeNum = episodeRaw ? parseInt(episodeRaw.replace(/^\D/, ""), 10) : undefined

  return { seasonNum, episodeNum, episodeTitle }
}

presence.on("UpdateData", async (ctx) => {
  const { pathname, href } = document.location
  const video = findVideo()
  const playing = video && hasPlayerTabs()

  if (video && playing) {
    const title = text($(".video-metadata .title"))
    const subtitle = text($(".video-metadata .subtitle-text"))
    const genre = text($(".metadata-genre"))
    const thumbnail = getThumbnail()
    const isPaused = !!video.paused

    const data: Parameters<typeof presence.setActivity>[0] = {
      largeImageKey: thumbnail || Assets.Logo,
      largeImageText: title || "Apple TV+",
      type: PresenceType.Watching,
      buttons: [{
        label: subtitle ? "Watch Episode" : "Watch Show",
        url: href,
      }],
    }

    if (subtitle) {
      const { seasonNum, episodeNum, episodeTitle } = parseSubtitle(subtitle)
      data.details = title || "Apple TV+"
      data.state = episodeTitle
        ? `S${seasonNum}:E${episodeNum} ${episodeTitle}`
        : `Season ${seasonNum}, Episode ${episodeNum}`
    } else {
      data.details = title || getPageTitle() || "Apple TV+"
      data.state = genre || "Movie"
    }

    if (isPaused) {
      data.smallImageKey = "pause"
      data.smallImageText = "Paused"
    } else {
      data.smallImageKey = "play"
      data.smallImageText = "Playing"
      Object.assign(data, createMediaTimestamps(video))
    }

    await presence.setActivity(data)
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (pathname === "/" || pathname.startsWith("/home")) {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/search")) {
    const query = new URLSearchParams(document.location.search).get("q")
    await presence.setActivity({
      details: "Searching",
      state: query ? `"${query}"` : undefined,
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/show/")) {
    const pageTitle = getPageTitle()
    await presence.setActivity({
      details: pageTitle || "Viewing series",
      state: pageTitle ? undefined : getPageDescription(),
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/room/")) {
    await presence.setActivity({
      details: "In a SharePlay room",
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
