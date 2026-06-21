import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { handleBrowsingActivity } from "./utils/browsing"
import { findVideo, getPlayerMetadata, getPoster } from "./utils/player"

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
      "en-US": "When enabled, your presence will also show when browsing Paramount+ (home, search, shows, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Paramount+ (accueil, recherche, séries, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Paramount+ (inicio, búsqueda, series, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => {
  const { pathname, href } = document.location
  const video = findVideo()
  const isLive = pathname.includes("/live-tv/")
  const playerArea = document.querySelector(".video__player-area")
  const onWatchRoute = /\/(?:shows|movies)\/video\//.test(pathname) || isLive

  const isWatching = !!video && onWatchRoute && (!!playerArea || video.duration > 0)

  if (isWatching && video) {
    const { title, episode } = getPlayerMetadata()
    const poster = getPoster()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "Paramount+",
      state: isLive ? "Live TV" : episode,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title || "Paramount+",
      type: PresenceType.Watching,
      buttons: [{
        label: episode ? "Watch Episode" : "Watch Now",
        url: href.split("?")[0] || href,
      }],
    }

    if (video.paused) {
      data.smallImageKey = "pause"
      data.smallImageText = "Paused"
    } else {
      data.smallImageKey = "play"
      data.smallImageText = "Playing"
      if (!isLive) Object.assign(data, createMediaTimestamps(video))
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
