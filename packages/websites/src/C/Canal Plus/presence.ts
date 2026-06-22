import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { handleBrowsingActivity } from "./utils/browsing"
import { findVideo, getPageMetadata, isLivePath } from "./utils/player"

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
      "en-US": "When enabled, your presence will also show when browsing CANAL+ (home, search, cinema, series, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur CANAL+ (accueil, recherche, cinéma, séries, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por CANAL+ (inicio, búsqueda, cine, series, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => {
  const { pathname, href } = document.location
  const video = findVideo()
  const live = isLivePath(pathname, video)
  const isProgrammePath = /\/h\/\d+/i.test(pathname)
  const isWatching = !!video && (isProgrammePath || live || video.duration > 0)

  if (isWatching && video) {
    const metadata = await getPageMetadata()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: metadata.title || "CANAL+",
      state: live ? metadata.subtitle || "Live TV" : metadata.subtitle,
      largeImageKey: metadata.image || Assets.Logo,
      largeImageText: metadata.title || "CANAL+",
      type: PresenceType.Watching,
      buttons: [{
        label: live ? "Watch Live" : "Watch Now",
        url: href.split("?")[0] || href,
      }],
    }

    if (video.paused) {
      data.smallImageKey = "pause"
      data.smallImageText = "Paused"
    } else {
      data.smallImageKey = "play"
      data.smallImageText = "Playing"
      if (!live) Object.assign(data, createMediaTimestamps(video))
    }

    await presence.setActivity(data)
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  await handleBrowsingActivity(presence, pathname)
})
