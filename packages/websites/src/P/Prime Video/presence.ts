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
      "en-US": "When enabled, your presence will also show when browsing Prime Video (home, search, categories, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Prime Video (accueil, recherche, catégories, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Prime Video (inicio, búsqueda, categorías, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    "#dv-web-player video",
    "#dv-web-player .atvwebplayersdk-video-surface video",
    ".atvwebplayersdk-player-container video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

const findSeriesTitle = (): string | null => {
  const el = document.querySelector(".atvwebplayersdk-title-text")
  return el?.textContent?.trim() || null
}

const findEpisodeInfo = (): { season?: string; episode?: string; episodeTitle?: string } | null => {
  const el = document.querySelector(".atvwebplayersdk-episode-info")
  if (!el?.textContent) return null

  const text = el.textContent.trim()
  const match = text.match(/S\.(\d+)\s*Ép\.(\d+)\s*(.*)/i)
  if (match) {
    return {
      season: match[1],
      episode: match[2],
      episodeTitle: match[3]?.trim() || undefined,
    }
  }

  return null
}

const findTitleText = (): string | null => {
  const selectors = [
    ".atvwebplayersdk-player-container h1",
    ".atvwebplayersdk-player-container [class*='title']",
    ".DVWebNode-detail-atf-wrapper picture img",
    ".DVWebNode-detail-atf-wrapper h1",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement | HTMLImageElement>(selector)
    if (!el) continue
    const text = el instanceof HTMLImageElement ? el.alt : el.textContent?.trim()
    if (text) return text
  }

  return null
}

const findBanner = (): string | undefined => {
  const selectors = [
    '[data-automation-id="hero-background"] img',
    "#atf-full",
    ".atvwebplayersdk-player-container img[src*='https']",
    "main div[data-automation-id='hero-background'] img",
  ] as const

  for (const selector of selectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    if (img?.src) return img.src
  }

  return undefined
}

const findDescription = (): string | undefined => {
  const el = document.querySelector('div[class^=synopsis] > span, [data-automation-id="synopsis"]')
  return el?.textContent?.trim() || undefined
}

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

  if (pathname.includes("/storefront") || pathname === "/") {
    await presence.setActivity({
      details: "Viewing Home",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/search/")) {
    const searchSummary = document.querySelector(".av-refine-bar-summaries")
    const query = searchSummary?.textContent?.match(/["„]([^"”]+)/)?.[1]
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/movie")) {
    await presence.setActivity({
      details: "Viewing Movies",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/tv")) {
    await presence.setActivity({
      details: "Viewing TV-Series",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/sports")) {
    await presence.setActivity({
      details: "Viewing Sports",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/livetv")) {
    await presence.setActivity({
      details: "Viewing Live TV",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/categories")) {
    await presence.setActivity({
      details: "Viewing Categories",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/kids/")) {
    await presence.setActivity({
      details: "Viewing Movies for kids",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/genre/")) {
    await presence.setActivity({
      details: "Viewing Genres",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("shop")) {
    await presence.setActivity({
      details: "Browsing the store...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
})