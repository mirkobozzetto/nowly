import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { getDisneyPlayerData, installDisneyBridge } from "./utils/bridge"
import { createDisneyImageUrl, findEntityTitle, findVideo, isEpisodeSubtitle, parseEpisodeState } from "./utils/dom"

installDisneyBridge()

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
      "en-US": "When enabled, your presence will also show when browsing Disney+ (home, search, categories, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Disney+ (accueil, recherche, catégories, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Disney+ (inicio, búsqueda, categorías, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location
  const video = findVideo()
  const { imageId, title, subtitle } = getDisneyPlayerData()

  if (pathname.includes("/play/") && video && imageId) {
    const largeImageKey = createDisneyImageUrl(imageId)
    const state = parseEpisodeState(subtitle)

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "Disney+",
      state,
      largeImageKey,
      largeImageText: title || "Disney+",
      type: PresenceType.Watching,
      buttons: [{
        label: isEpisodeSubtitle(subtitle) ? "Watch Episode" : "Watch Movie",
        url: window.location.href,
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

  if (pathname.includes("/entity/")) {
    const title = findEntityTitle()
    const isSeries = !!document.querySelector("#episodes_control")

    await presence.setActivity({
      details: isSeries ? "Viewing series" : "Viewing movie",
      state: title,
      largeImageKey: Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
    })
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (pathname === "/" || pathname.includes("/home")) {
    await presence.setActivity({
      details: "Browsing home",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/search")) {
    const query = document.querySelector<HTMLInputElement>('input[type="search"]')?.value
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/watchlist")) {
    await presence.setActivity({
      details: "Browsing watchlist",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/series")) {
    await presence.setActivity({
      details: "Browsing series",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/movies")) {
    await presence.setActivity({
      details: "Browsing movies",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
})