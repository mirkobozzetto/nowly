import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { findVideo, isOnChannelPage, isOnClipPage, isOnVideoPage } from "./utils/dom"
import { findGame, findStreamerAvatar, findStreamerName, findStreamTitle } from "./utils/streamer"
import { getClipInfo, getVodTitle } from "./utils/vod"

const settings = Presence.Settings({
  showVods: {
    type: "boolean",
    default: true,
    label: {
      "en-US": "Show VOD activity",
      "fr-FR": "Afficher l'activité des VODs",
      "es-ES": "Mostrar actividad de VODs",
    },
    description: {
      "en-US": "Show presence activity when watching VODs or clips.",
      "fr-FR": "Affiche votre activité lorsque vous regardez des VODs ou des clips.",
      "es-ES": "Muestra actividad de presencia al ver VODs o clips.",
    },
  },
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

presence.on("UpdateData", async (ctx) => {
  const video = findVideo()
  const { pathname } = document.location

  const isOnVideo = isOnVideoPage()
  const isClip = isOnClipPage()
  // On a VOD/clip page duration is irrelevant — only rely on path for detection
  const isLive = !isOnVideo && !isClip && video && video.duration >= 1073741824

  if (isLive) {
    const title = findStreamTitle()
    const streamer = findStreamerName()
    const game = findGame()
    const avatar = findStreamerAvatar(streamer)

    await presence.setActivity({
      details: title || "Live",
      state: streamer ? `${streamer}${game ? ` — ${game}` : ""}` : game,
      largeImageKey: avatar || Assets.Logo,
      largeImageText: streamer || "Twitch",
      smallImageKey: "live",
      smallImageText: "Live",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Stream", url: window.location.href.split("?")[0] }],
    })
    return
  }

  if (isOnVideo) {
    if (!ctx.settings.showVods) {
      presence.clearActivity()
      return
    }

    const title = getVodTitle()
    const streamer = findStreamerName()
    const avatar = findStreamerAvatar(streamer)

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "VOD",
      state: streamer,
      largeImageKey: avatar || Assets.Logo,
      largeImageText: streamer || "Twitch",
      smallImageKey: video?.paused ? "pause" : "play",
      smallImageText: video?.paused ? "Paused" : "Playing",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Video", url: window.location.href.split("?")[0] }],
    }

    if (video && !video.paused) Object.assign(data, createMediaTimestamps(video))

    await presence.setActivity(data)
    return
  }

  if (isClip) {
    if (!ctx.settings.showVods) {
      presence.clearActivity()
      return
    }

    const { title, creator } = getClipInfo()
    const avatar = findStreamerAvatar(creator)

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title || "Clip",
      state: creator,
      largeImageKey: avatar || Assets.Logo,
      largeImageText: creator || "Twitch Clip",
      smallImageKey: video?.paused ? "pause" : "play",
      smallImageText: video?.paused ? "Paused" : "Playing",
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Clip", url: window.location.href }],
    }

    if (video && !video.paused) Object.assign(data, createMediaTimestamps(video))

    await presence.setActivity(data)
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (isOnChannelPage()) {
    const streamer = findStreamerName()
    const avatar = findStreamerAvatar(streamer)
    await presence.setActivity({
      details: streamer ? `Viewing ${streamer}` : "Viewing channel",
      state: "Browsing...",
      largeImageKey: avatar || Assets.Logo,
      largeImageText: streamer || "Twitch",
      smallImageKey: Assets.Logo,
      smallImageText: "Twitch",
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
