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
      "en-US": "When enabled, your presence will also show when browsing Nakastream (home, search, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Nakastream (accueil, recherche, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Nakastream (inicio, búsqueda, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

const findPoster = (): string | undefined => {
  const selectors = [
    ".nk-poster img",
    ".nk-thumbnail img",
    ".player-poster img",
    "img.nk-cover",
    "img[class*='poster']",
    "img[class*='thumbnail']",
    "img[class*='cover']",
  ] as const

  for (const selector of selectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    if (img?.src) return img.src
  }

  return undefined
}

const getNakastreamInfo = () => {
  const params = new URLSearchParams(location.search)
  const title =
    params.get("title") ||
    document.querySelector("span.nk-title")?.textContent?.trim() ||
    null
  const type = params.get("type")
  const season = params.get("season") ?? params.get("s")
  const ep = params.get("episode") ?? params.get("ep") ?? params.get("e")
  const episodeTitle =
    params.get("ep_title") ??
    params.get("episode_title") ??
    params.get("etitle") ??
    null
  return {
    title,
    contentType: type === "movie" ? "movie" : "series",
    season: season ? Number(season) : null,
    episodeNum: ep ? Number(ep) : null,
    episodeTitle,
  }
}

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location

  if (pathname.startsWith("/player")) {
    const video = document.querySelector<HTMLVideoElement>("video")
    const nk = getNakastreamInfo()
    const poster = findPoster()
    const title = nk.title || "Nakastream"

    let state: string | undefined

    if (nk.contentType === "series" && nk.season != null && nk.episodeNum != null) {
      state = `S${nk.season}.E${nk.episodeNum}`
      if (nk.episodeTitle) state += ` ${nk.episodeTitle}`
    } else if (nk.episodeTitle) {
      state = nk.episodeTitle
    }

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title,
      state,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
      buttons: [
        {
          label: nk.contentType === "movie" ? "Watch Movie" : "Watch Episode",
          url: location.href,
        },
      ],
    }

    if (video && !video.paused && !video.ended) {
      data.smallImageKey = "play"
      data.smallImageText = "Playing"
      Object.assign(data, createMediaTimestamps(video))
    } else {
      data.smallImageKey = "pause"
      data.smallImageText = "Paused"
    }

    await presence.setActivity(data)
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  await presence.setActivity({
    details: "Browsing Nakastream",
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
