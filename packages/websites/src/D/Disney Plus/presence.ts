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
      "en-US": "When enabled, your presence will also show when browsing Disney+ (home, search, categories, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Disney+ (accueil, recherche, catégories, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Disney+ (inicio, búsqueda, categorías, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    'video[id^="hivePlayer"]',
    ".btm-media-player video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

const findTitle = (): string | undefined => {
  const img = document.querySelector<HTMLImageElement>('[data-testid="details-title-treatment"] img')
  if (img?.alt) return img.alt

  return document.title.split("|")[0]?.trim() || undefined
}

const findSubtitle = (): string | undefined => {
  const el = document.querySelector('[data-testid="item-metadata"]')
  return el?.textContent?.trim() || undefined
}

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location
  const video = findVideo()

  if (pathname.includes("/play/") && video) {
    const title = findTitle()
    const subtitle = findSubtitle()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "Disney+",
      state: subtitle,
      largeImageKey: Assets.Logo,
      largeImageText: title || "Disney+",
      type: PresenceType.Watching,
      buttons: [{
        label: subtitle?.includes(":E") ? "Watch Episode" : "Watch Movie",
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
    const title = findTitle()
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
