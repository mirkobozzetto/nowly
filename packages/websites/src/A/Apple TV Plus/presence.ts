import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { $, findVideo, hasPlayerTabs, text } from "./utils/dom"
import { getPageDescription, getPageTitle, getThumbnail, parseSubtitle } from "./utils/metadata"

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
