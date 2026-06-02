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
      "en-US": "When enabled, your presence will also show when browsing Twitch (directory, channel pages, etc.), not just when watching a stream or video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Twitch (répertoire, chaînes, etc.), pas seulement quand vous regardez un stream ou une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Twitch (directorio, canales, etc.), no solo al ver un directo o vídeo.",
    },
  },
})

const presence = new Presence(settings)

const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".channel-root video",
    ".video-player video",
    ".persistent-player video",
    ".tw-full-screen video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

const findStreamTitle = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-title"]',
    ".stream-info-card p a",
    ".channel-info-content h2",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

const findStreamerName = (): string | undefined => {
  const selectors = [
    ".channel-info-content h1",
    ".channel-root__info h1",
    ".tw-title",
    '[class*="channel-header"] h1',
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

const findGame = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-game-link"]',
    ".stream-info-card [data-a-target='stream-game-link']",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

const isOnChannelPage = (): boolean => {
  const path = location.pathname
  const parts = path.replace(/\/$/, "").split("/").filter(Boolean)
  return parts.length === 1 && !["directory", "search", "downloads", "turbo", "jobs"].includes(parts[0]!)
}

const isOnVideoPage = (): boolean => {
  return location.pathname.includes("/videos/")
}

const isOnClipPage = (): boolean => {
  return location.hostname === "clips.twitch.tv" || location.pathname.includes("/clip/")
}

const getClipInfo = (): { title?: string; creator?: string } => {
  const title = document.querySelector("article h1")?.textContent?.trim()
  const creator = document.querySelector(".clip-creator a")?.textContent?.trim()
  return { title, creator }
}

presence.on("UpdateData", async (ctx) => {
  const video = findVideo()
  const { pathname, hostname } = document.location

  const isLive = video && video.duration >= 1073741824
  const isOnVideo = isOnVideoPage() && video && video.duration < 1073741824
  const isClip = isOnClipPage()

  if (isLive) {
    const title = findStreamTitle()
    const streamer = findStreamerName()
    const game = findGame()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "Live",
      state: streamer ? `${streamer}${game ? ` — ${game}` : ""}` : game,
      largeImageKey: Assets.Logo,
      largeImageText: title || "Twitch",
      smallImageKey: "live",
      smallImageText: "Live",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Stream", url: window.location.href.split("?")[0] }],
    }

    await presence.setActivity(data)
    return
  }

  if (isOnVideo) {
    const title = document.title.replace(" - Twitch", "").split(" - ")[0]?.trim()
    const uploader = findStreamerName()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "VOD",
      state: uploader,
      largeImageKey: Assets.Logo,
      largeImageText: title || "Twitch",
      smallImageKey: video?.paused ? "pause" : "play",
      smallImageText: video?.paused ? "Paused" : "Playing",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Video", url: window.location.href.split("?")[0] }],
    }

    if (video && !video.paused) {
      Object.assign(data, createMediaTimestamps(video))
    }

    await presence.setActivity(data)
    return
  }

  if (isClip) {
    const clipInfo = getClipInfo()

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: clipInfo.title || "Clip",
      state: clipInfo.creator,
      largeImageKey: Assets.Logo,
      largeImageText: clipInfo.title || "Twitch Clip",
      smallImageKey: video?.paused ? "pause" : "play",
      smallImageText: video?.paused ? "Paused" : "Playing",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Clip", url: window.location.href }],
    }

    if (video && !video.paused) {
      Object.assign(data, createMediaTimestamps(video))
    }

    await presence.setActivity(data)
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (isOnChannelPage()) {
    const streamer = findStreamerName()
    await presence.setActivity({
      details: streamer ? `Viewing ${streamer}` : "Viewing channel",
      state: "Browsing...",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
    return
  }

  const path = pathname.replace(/\/$/, "")

  if (path === "" || path === "/") {
    await presence.setActivity({
      details: "Browsing home",
      state: "Twitch",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/directory/")) {
    await presence.setActivity({
      details: "Browsing directory",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/search")) {
    const query = new URLSearchParams(window.location.search).get("term")
    await presence.setActivity({
      details: "Searching for:",
      state: query || "...",
      largeImageKey: Assets.Logo,
      smallImageKey: "search",
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/team/")) {
    const team = pathname.split("/").pop()
    await presence.setActivity({
      details: "Viewing team",
      state: team,
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/subscriptions")) {
    await presence.setActivity({
      details: "Viewing subscriptions",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/wallet")) {
    await presence.setActivity({
      details: "Viewing wallet",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else if (pathname.includes("/drops")) {
    await presence.setActivity({
      details: "Viewing Drops",
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
    })
  } else {
    presence.clearActivity()
  }
})
