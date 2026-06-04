import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { Category } from "./utils/categories"
import { $, text, findVideo } from "./utils/dom"
import { findTitle, findUploader, getChannelName, getChannelAvatar, getChannelSubscribers } from "./utils/channel"

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
      "en-US": "When enabled, your presence will also show when browsing YouTube (home, search, subscriptions, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur YouTube (accueil, recherche, abonnements, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por YouTube (inicio, búsqueda, suscripciones, etc.), no solo al ver un vídeo.",
    },
  },
  showChannels: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Show channel details",
      "fr-FR": "Afficher les détails de la chaîne",
      "es-ES": "Mostrar detalles del canal",
    },
    description: {
      "en-US": "When enabled, your presence will show the channel name and avatar when viewing a channel page.",
      "fr-FR": "Quand activé, votre présence affichera le nom et l'avatar de la chaîne lorsque vous consultez une page chaîne.",
      "es-ES": "Cuando está activado, tu presencia mostrará el nombre y avatar del canal al ver una página de canal.",
    },
  },
})

const presence = new Presence(settings)
let prevPath = ""

presence.on("UpdateData", async (ctx) => {
  const { pathname, href, search } = document.location

  if (pathname !== prevPath) {
    prevPath = pathname
    await new Promise((r) => setTimeout(r, 800))
  }

  const video = findVideo()
  const videoId = new URLSearchParams(search).get("v")

  if (video && videoId) {
    const title = findTitle()
    const isPlaying = !video.paused
    const uploader = findUploader(videoId)

    await presence.setActivity({
      details: title,
      ...(uploader ? { state: uploader } : {}),
      largeImageKey: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
      largeImageText: title,
      smallImageKey: isPlaying ? "play" : "pause",
      smallImageText: isPlaying ? "Playing" : "Paused",
      ...createMediaTimestamps(video),
      type: PresenceType.Watching,
      buttons: [{ label: "Watch Video", url: href.split("&")[0] }],
    })
    return
  }

  const playablesMatch = pathname.match(/^\/playables\/([^/]+)$/)
  if (playablesMatch) {
    const gameName = text($(".ytMiniAppTopBarViewModelTitle"))
    const gameIcon = $<HTMLMetaElement>("meta[property='og:image']")?.content
      || document.querySelector<HTMLElement>(".miniAppSplashScreenViewModelBackgroundBlur")?.style.backgroundImage?.match(/url\("([^"]+)"\)/)?.[1]

    await presence.setActivity({
      details: gameName || "Playing a game",
      state: findUploader(),
      largeImageKey: gameIcon || Category.Playables,
      largeImageText: gameName || "YouTube Playables",
      startTimestamp: Math.floor(Date.now() / 1000),
      type: PresenceType.Watching,
      buttons: [{ label: "Play Game", url: href.split("?")[0] }],
    })
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  if (pathname === "/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ" || pathname === "/@youtubemusic") {
    await presence.setActivity({
      details: "Browsing YouTube Music",
      largeImageKey: Category.Music,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/channel/UC4R8DWoMoI7CAwX8_LjQHig") {
    await presence.setActivity({
      details: "Browsing YouTube Live",
      largeImageKey: Category.Live,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname === "/channel/UCrpQ4p1Ql_hG8rKXIKM1MOQ") {
    await presence.setActivity({
      details: "Browsing YouTube Fashion",
      largeImageKey: Category.Fashion,
      type: PresenceType.Watching,
    })
    return
  }

  if (pathname.startsWith("/@") || pathname.startsWith("/channel/")) {
    if (ctx.settings.showChannels) {
      const channelName = getChannelName()
      const avatar = getChannelAvatar()
      const subscribers = getChannelSubscribers()

      await presence.setActivity({
        details: channelName || "Viewing channel",
        state: subscribers,
        largeImageKey: avatar || Assets.Logo,
        largeImageText: channelName || "YouTube",
        type: PresenceType.Watching,
      })
    } else {
      await presence.setActivity({
        details: "Viewing channel",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
    }
    return
  }

  if (pathname === "/" || pathname === "/feed/trending") {
      await presence.setActivity({
        details: "Browsing home",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/results")) {
      const query = new URLSearchParams(search).get("search_query")
      await presence.setActivity({
        details: "Searching",
        state: query ? `"${query}"` : undefined,
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/subscriptions")) {
      await presence.setActivity({
        details: "Browsing subscriptions",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/history")) {
      await presence.setActivity({
        details: "Viewing history",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/playlists")) {
      await presence.setActivity({
        details: "Browsing playlists",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/you")) {
      await presence.setActivity({
        details: "Browsing your feed",
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/storefront")) {
      await presence.setActivity({
        details: "Browsing movies & TV",
        largeImageKey: Category.Storefront,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/gaming")) {
      await presence.setActivity({
        details: "Browsing gaming",
        largeImageKey: Category.Gaming,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/podcasts")) {
      await presence.setActivity({
        details: "Browsing podcasts",
        largeImageKey: Category.Podcasts,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/playables")) {
      await presence.setActivity({
        details: "Playing games",
        largeImageKey: Category.Playables,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/feed/courses_destination")) {
      await presence.setActivity({
        details: "Browsing courses",
        largeImageKey: Category.Courses,
        type: PresenceType.Watching,
      })
      return
    }

    if (pathname.startsWith("/playlist")) {
      const list = new URLSearchParams(search).get("list")
      let playlistName = "Viewing playlist"
      if (list === "WL") playlistName = "Watch Later"
      else if (list === "LL") playlistName = "Liked videos"

      await presence.setActivity({
        details: playlistName,
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
