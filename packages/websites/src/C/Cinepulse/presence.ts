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
      "en-US": "Show presence when browsing Cinepulse (home, catalog, etc.), not just when watching content.",
      "fr-FR": "Afficher la présence lors de la navigation sur Cinepulse (accueil, catalogue, etc.), pas seulement lors du visionnage.",
      "es-ES": "Mostrar presencia al navegar por Cinepulse (inicio, catálogo, etc.), no solo al ver contenido.",
    },
  },
})

const presence = new Presence(settings)

const getTitle = (): string =>
  document.title.replace(/^Cinepulse\s*[-–]\s*/, "").trim() || "Cinepulse"

const getSheetPoster = (): string | undefined =>
  document.querySelector<HTMLImageElement>("img[alt^='Poster']")?.src ?? undefined

const getPlayerPoster = (): string | undefined =>
  document.querySelector<HTMLImageElement>("[data-media-provider] img")?.src ?? undefined

// Find the episode info span (e.g. "S1:E1 - "Épisode 1"") in the player controls
const getEpisodeSpan = (): HTMLSpanElement | null => {
  for (const el of document.querySelectorAll<HTMLSpanElement>("[data-media-player] span")) {
    if (/^S\d+:E\d+/.test(el.textContent?.trim() ?? "")) return el
  }
  return null
}

presence.on("UpdateData", async (ctx) => {
  const { pathname } = location

  // Player page (/play/{token})
  if (pathname.startsWith("/play/")) {
    const video = document.querySelector<HTMLVideoElement>("video")
    const mediaPlayer = document.querySelector("[data-media-player]")
    const poster = getPlayerPoster()

    const episodeEl = getEpisodeSpan()
    // For series: the series title is the sibling just before the episode span
    const seriesTitleEl = episodeEl?.previousElementSibling as HTMLSpanElement | null
    const title = seriesTitleEl?.textContent?.trim() || getTitle()
    const episodeLabel = episodeEl?.textContent?.trim()

    const isPlaying = video
      ? !video.paused && !video.ended
      : !mediaPlayer?.hasAttribute("data-paused")

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title,
      state: episodeLabel,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      smallImageKey: isPlaying ? "play" : "pause",
      smallImageText: isPlaying ? "Playing" : "Paused",
      type: PresenceType.Watching,
    }

    if (isPlaying && video) {
      Object.assign(data, createMediaTimestamps(video))
    }

    await presence.setActivity(data)
    return
  }

  // Sheet page (/sheet/movie-{id} or /sheet/tv-{id})
  const sheetMatch = pathname.match(/^\/sheet\/(movie|tv)-\d+/)
  if (sheetMatch) {
    const contentType = sheetMatch[1] as "movie" | "tv"
    const title = getTitle()
    const poster = getSheetPoster()

    await presence.setActivity({
      details: contentType === "movie" ? "Viewing a movie" : "Viewing a TV show",
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
    details: "Browsing Cinepulse",
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
