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

const findVideo = (): HTMLVideoElement | null => {
  return document.querySelector<HTMLVideoElement>("video")
}

const findTitle = (): string | undefined => {
  const el = document.querySelector(".video-metadata .title")
  return el?.textContent?.trim() || undefined
}

const findSubtitle = (): string | undefined => {
  const el = document.querySelector(".video-metadata .subtitle-text")
  return el?.textContent?.trim() || undefined
}

const findGenre = (): string | undefined => {
  const el = document.querySelector(".metadata-genre")
  return el?.textContent?.trim() || undefined
}

const getThumbnail = (): string | undefined => {
  const artwork = navigator.mediaSession.metadata?.artwork
  if (artwork && artwork.length > 0) {
    return artwork[artwork.length - 1]?.src
  }
  return undefined
}

presence.on("UpdateData", async (ctx) => {
  const { pathname, hostname } = document.location
  const video = findVideo()
  const isOnPlayer = !!document.querySelector(".video-player__tabs")

  if (video && isOnPlayer) {
    const title = findTitle()
    const subtitle = findSubtitle()
    const thumbnail = getThumbnail()

    const data: Parameters<typeof presence.setActivity>[0] = {
      largeImageKey: thumbnail || Assets.Logo,
      largeImageText: title || "Apple TV+",
      type: PresenceType.Watching,
      buttons: [{
        label: subtitle ? "Watch Episode" : "Watch Movie",
        url: window.location.href,
      }],
    }

    if (subtitle) {
      const parts = subtitle.split(/, | · /)
      const seasonNum = parts[0] ? parseInt(parts[0].replace(/^\D/, "")) : undefined
      const episodeNum = parts[1] ? parseInt(parts[1].replace(/^\D/, "")) : undefined
      const episodeTitle = parts[2] as string | undefined

      data.details = title || "Apple TV+"
      data.state = `S${seasonNum}:E${episodeNum} ${episodeTitle || ""}`.trim()
    } else {
      data.details = title || "Apple TV+"
      data.state = findGenre() || "Movie"
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
  } else if (pathname.includes("/show/")) {
    await presence.setActivity({
      details: "Viewing series",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/movie/")) {
    await presence.setActivity({
      details: "Viewing movie",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
})
