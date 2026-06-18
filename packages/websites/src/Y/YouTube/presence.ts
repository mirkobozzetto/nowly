import { createMediaTimestamps, PresenceType } from "@nowly/presence"
import { Category } from "./utils/categories"
import { $, text, findVideo } from "./utils/dom"
import { findTitle, findUploader } from "./utils/channel"
import { handleBrowsingActivity } from "./utils/browsing"

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

  await handleBrowsingActivity(presence, ctx.settings)
})
