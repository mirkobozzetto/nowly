import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { handleBrowsingActivity } from "./utils/browsing"
import {
  clearMetadata,
  fetchMetadata,
  findCurrentEpisode,
  getBoxart,
  getVideoId,
} from "./utils/metadata"
import { findVideo } from "./utils/player"

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
      "en-US": "When enabled, your presence will also show when browsing Netflix (home, search, title pages, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Netflix (accueil, recherche, pages de titres, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Netflix (inicio, búsqueda, páginas de títulos, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location
  const href = window.location.href
  const id = getVideoId(href)

  // Watching a movie or episode.
  if (pathname.includes("/watch") && id) {
    const video = findVideo()

    if (video) {
      const meta = await fetchMetadata(id)
      const v = meta?.video
      const isEpisode = v?.type === "show"

      let state: string | undefined
      if (v?.type === "show") {
        const current = findCurrentEpisode(v)
        if (current) {
          const { season, episode } = current
          state = `S${season.seq}.E${episode.seq}`
          if (episode.title) state += ` ${episode.title}`
        }
      } else if (v?.type === "movie" && v.year) {
        state = String(v.year)
      }

      const data: Parameters<typeof presence.setActivity>[0] = {
        details: v?.title || "Watching",
        state,
        largeImageKey: getBoxart(v) || Assets.Logo,
        largeImageText: v?.title || "Netflix",
        type: PresenceType.Watching,
        buttons: [{
          label: isEpisode ? "Watch Episode" : "Watch Movie",
          url: href.split("?")[0] || href,
        }],
      }

      if (video.paused) {
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
  }

  if (!ctx.settings.showBrowsing) {
    clearMetadata()
    presence.clearActivity()
    return
  }

  // Viewing a title detail page (/title/{id} or ?jbv={id}).
  if (id) {
    const meta = await fetchMetadata(id)
    const v = meta?.video

    await presence.setActivity({
      details: v?.title || "Viewing a title",
      state: v?.synopsis?.slice(0, 128),
      largeImageKey: getBoxart(v) || Assets.Logo,
      largeImageText: v?.title || "Netflix",
      type: PresenceType.Watching,
      buttons: [{
        label: v?.type === "show" ? "View Series" : "View Movie",
        url: href,
      }],
    })
    return
  }

  await handleBrowsingActivity(presence, pathname)
})