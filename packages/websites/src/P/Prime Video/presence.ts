import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { handleBrowsingActivity } from "./utils/browsing"
import {
  findBanner,
  findDescription,
  findEpisodeInfo,
  findSeriesTitle,
  findTitleText,
  findVideo,
} from "./utils/player"

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
      "en-US": "When enabled, your presence will also show when browsing Prime Video (home, search, categories, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Prime Video (accueil, recherche, catégories, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Prime Video (inicio, búsqueda, categorías, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location
  const isOnDetailPage = pathname.includes("/detail/")

  if (isOnDetailPage) {
    const seriesTitle = findSeriesTitle()
    const episode = findEpisodeInfo()
    const titleText = seriesTitle || findTitleText()
    const video = findVideo()

    if (video && (seriesTitle || episode)) {
      const bannerImg = findBanner()
      const description = findDescription()

      let state: string | undefined

      if (episode) {
        state = `S${episode.season}.E${episode.episode}`
        if (episode.episodeTitle) {
          state += ` ${episode.episodeTitle}`
        }
      } else {
        const desc = description && description !== titleText ? description : undefined
        state = desc
      }

      const data: Parameters<typeof presence.setActivity>[0] = {
        details: titleText ?? undefined,
        state,
        largeImageKey: bannerImg || Assets.Logo,
        largeImageText: titleText ?? undefined,
        type: PresenceType.Watching,
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

    if (titleText) {
      const bannerImg = findBanner()
      await presence.setActivity({
        details: "Viewing details",
        state: titleText,
        largeImageKey: bannerImg || Assets.Logo,
        largeImageText: titleText,
        type: PresenceType.Watching,
      })
      return
    }
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  await handleBrowsingActivity(presence, pathname)
})
