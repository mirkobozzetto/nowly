import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { formatEpisodeState, getNakastreamInfo } from "./utils/info"
import {
  cacheVisiblePosters,
  findContentPosterImage,
  findPoster,
  getCachedPoster,
  getContentCacheKey,
  getContentPageType,
  normalizePosterUrl,
} from "./utils/posters"

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

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location

  if (pathname.startsWith("/player")) {
    const video = document.querySelector<HTMLVideoElement>("video")
    const nk = getNakastreamInfo()
    const cacheKey = getContentCacheKey(nk.contentType === "movie" ? "movie" : "tv", nk.id)
    const poster = nk.poster || getCachedPoster(cacheKey) || getCachedPoster(nk.title) || findPoster()
    const title = nk.title || "Nakastream"
    const state = formatEpisodeState(nk)

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title,
      state,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
      buttons: [
        {
          label: nk.contentType === "movie" ? "View Movie" : "View Episode",
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

  cacheVisiblePosters()

  const contentType = getContentPageType()
  if (contentType) {
    const img = findContentPosterImage()
    const title =
      img?.alt.trim() ||
      document.querySelector<HTMLHeadingElement>("h1")?.textContent?.trim() ||
      document.title.replace(/[-|].*$/, "").trim() ||
      "Nakastream"
    const poster = normalizePosterUrl(img?.src) || getCachedPoster(title)

    await presence.setActivity({
      details: contentType === "movie" ? "Viewing movie" : "Viewing TV show",
      state: title,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
      buttons: [
        {
          label: contentType === "movie" ? "View Movie" : "View TV Show",
          url: location.href,
        },
      ],
    })
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
