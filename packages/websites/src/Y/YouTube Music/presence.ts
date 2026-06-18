import { createCachedImageProxyUrl, createImageProxyUrl, PresenceType, type PresenceData } from "@nowly/presence"

const settings = Presence.Settings({
  privacy: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Privacy mode",
      "fr-FR": "Mode privé",
      "es-ES": "Modo privado",
    },
    description: {
      "en-US": "Hide the track title, artist, artwork, and buttons.",
      "fr-FR": "Masque le titre, l'artiste, la pochette et les boutons.",
      "es-ES": "Oculta el título, artista, portada y botones.",
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
      "en-US": "Show activity while browsing YouTube Music without a detected track.",
      "fr-FR": "Affiche l'activité lorsque vous naviguez sur YouTube Music sans titre détecté.",
      "es-ES": "Muestra actividad al navegar por YouTube Music sin una canción detectada.",
    },
  },
  showButtons: {
    type: "boolean",
    default: true,
    label: {
      "en-US": "Show buttons",
      "fr-FR": "Afficher les boutons",
      "es-ES": "Mostrar botones",
    },
    description: {
      "en-US": "Show a button to open the current track.",
      "fr-FR": "Affiche un bouton pour ouvrir le titre en cours.",
      "es-ES": "Muestra un botón para abrir la canción actual.",
    },
  },
})

const presence = new Presence(settings)
const DISCORD_IMAGE_KEY_MAX_LENGTH = 300
const TRACK_STALE_MS = 15_000

type TrackInfo = {
  title: string
  artist?: string
  artwork?: string
  url: string
  playing: boolean
  currentTime?: number
  duration?: number
  updatedAt: number
}

let lastTrack: TrackInfo | undefined

const isEnabled = (value: unknown): boolean => value === true || value === "true"

const cleanText = (value: string | null | undefined): string | undefined => {
  const cleaned = value?.replace(/\s+/g, " ").trim()
  if (!cleaned || cleaned === "YouTube Music") return undefined
  return cleaned
}

const text = (selector: string, parent: ParentNode = document): string | undefined =>
  cleanText(parent.querySelector(selector)?.textContent)

const attr = (selector: string, attribute: string, parent: ParentNode = document): string | undefined => {
  const value = parent.querySelector(selector)?.getAttribute(attribute)
  return cleanText(value)
}

const findPlayerBar = (): Element | null =>
  document.querySelector("ytmusic-player-bar")
  ?? document.querySelector("#player-bar")

const findVideo = (): HTMLVideoElement | null =>
  document.querySelector<HTMLVideoElement>("video.html5-main-video")
  ?? document.querySelector<HTMLVideoElement>("#movie_player video")
  ?? document.querySelector<HTMLVideoElement>("video")

const normalizeArtworkUrl = (url: string | undefined): string | undefined => {
  if (!url?.startsWith("https://")) return undefined
  const videoId = url.match(/\/vi\/([^/?#]+)/)?.[1]
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return url
    .replace(/=w\d+-h\d+(-[a-z0-9-]+)?$/i, "=w544-h544-l90-rj")
    .replace(/=s\d+(-[a-z0-9-]+)?$/i, "=w544-h544-l90-rj")
}

const findArtwork = (playerBar: Element | null): string | undefined => {
  const mediaSessionArtwork = navigator.mediaSession.metadata?.artwork
  const largestMediaSessionArtwork = mediaSessionArtwork?.[mediaSessionArtwork.length - 1]?.src
  const normalizedMediaSessionArtwork = normalizeArtworkUrl(largestMediaSessionArtwork)
  if (normalizedMediaSessionArtwork) return normalizedMediaSessionArtwork

  const selectors = [
    "img.image",
    "yt-img-shadow.image img",
    ".thumbnail-image img",
    "img[src*='googleusercontent.com']",
    "img[src*='ytimg.com']",
  ]

  for (const selector of selectors) {
    const src = attr(selector, "src", playerBar ?? document)
    const normalized = normalizeArtworkUrl(src)
    if (normalized) return normalized
  }

  const metaImage = document.querySelector<HTMLMetaElement>("meta[property='og:image']")?.content
  const normalizedMetaImage = normalizeArtworkUrl(metaImage)
  if (normalizedMetaImage) return normalizedMetaImage

  const videoId = new URLSearchParams(document.location.search).get("v")
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined
}

const toDiscordImage = async (imageUrl: string | undefined): Promise<string | undefined> => {
  if (!imageUrl?.startsWith("https://")) return undefined
  if (imageUrl.length <= DISCORD_IMAGE_KEY_MAX_LENGTH) return imageUrl

  const cached = await createCachedImageProxyUrl("youtube", imageUrl)
  if (cached) return cached

  return createImageProxyUrl("youtube", imageUrl)
}

const findTitle = (playerBar: Element | null): string | undefined =>
  cleanText(navigator.mediaSession.metadata?.title)
  ?? text(".title.ytmusic-player-bar", playerBar ?? document)
  ?? text(".content-info-wrapper .title", playerBar ?? document)
  ?? text("yt-formatted-string.title", playerBar ?? document)
  ?? cleanText(document.title.replace(/ - YouTube Music$/, ""))

const findByline = (playerBar: Element | null): string | undefined =>
  text(".byline.ytmusic-player-bar", playerBar ?? document)
  ?? text(".subtitle.ytmusic-player-bar", playerBar ?? document)
  ?? text(".content-info-wrapper .byline", playerBar ?? document)

const findArtist = (playerBar: Element | null): string | undefined => {
  const mediaSessionArtist = cleanText(navigator.mediaSession.metadata?.artist)
  if (mediaSessionArtist) return mediaSessionArtist

  const byline = findByline(playerBar)
  if (!byline) return undefined
  return byline
    .split(/\s+[•\u2022]\s+/)
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" - ")
}

const isPlaying = (video: HTMLVideoElement | null, playerBar: Element | null): boolean => {
  if (video) return !video.paused

  const playPauseLabel = attr("#play-pause-button", "aria-label", playerBar ?? document)
    ?? attr("#play-pause-button", "title", playerBar ?? document)
    ?? attr("tp-yt-paper-icon-button[title]", "title", playerBar ?? document)

  return Boolean(playPauseLabel && /pause|mettre en pause|pausar/i.test(playPauseLabel))
}

const currentTrackUrl = (): string => {
  const url = new URL(document.location.href)
  const videoId = url.searchParams.get("v")

  if (videoId) {
    const trackUrl = new URL("https://music.youtube.com/watch")
    trackUrl.searchParams.set("v", videoId)
    const playlistId = url.searchParams.get("list")
    if (playlistId) trackUrl.searchParams.set("list", playlistId)
    return trackUrl.toString()
  }

  return document.location.href.split("&t=")[0]
}

const toAbsoluteUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  try {
    return new URL(value, document.location.origin).toString()
  } catch {
    return undefined
  }
}

const findTrackUrl = (playerBar: Element | null): string =>
  toAbsoluteUrl(attr(".title a[href]", "href", playerBar ?? document))
  ?? toAbsoluteUrl(attr("a[href*='/watch'][href*='v=']", "href", playerBar ?? document))
  ?? currentTrackUrl()

const createProgressTimestamps = (video: HTMLVideoElement | null, track: TrackInfo): Pick<PresenceData, "startTimestamp" | "endTimestamp"> => {
  if (!track.playing) return {}

  const currentTime = Number.isFinite(video?.currentTime)
    ? video?.currentTime
    : track.currentTime
  const duration = Number.isFinite(video?.duration)
    ? video?.duration
    : track.duration

  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || (duration ?? 0) <= 0) return {}

  const now = Math.floor(Date.now() / 1000)
  return {
    startTimestamp: now - Math.floor(currentTime ?? 0),
    endTimestamp: now + Math.max(0, Math.floor((duration ?? 0) - (currentTime ?? 0))),
  }
}

const getCurrentTrack = (playerBar: Element | null, video: HTMLVideoElement | null): TrackInfo | undefined => {
  const title = findTitle(playerBar)

  if (!title) {
    if (lastTrack && Date.now() - lastTrack.updatedAt < TRACK_STALE_MS) return lastTrack
    return undefined
  }

  const track: TrackInfo = {
    title,
    artist: findArtist(playerBar),
    artwork: findArtwork(playerBar),
    url: findTrackUrl(playerBar),
    playing: isPlaying(video, playerBar),
    currentTime: Number.isFinite(video?.currentTime) ? video?.currentTime : undefined,
    duration: Number.isFinite(video?.duration) ? video?.duration : undefined,
    updatedAt: Date.now(),
  }

  lastTrack = track
  return track
}

const browsingDetails = (pathname: string): string => {
  if (pathname === "/" || pathname === "/browse") return "Browsing home"
  if (pathname.startsWith("/search")) return "Searching"
  if (pathname.startsWith("/playlist")) return "Viewing a playlist"
  if (pathname.startsWith("/channel") || pathname.startsWith("/artist")) return "Viewing an artist"
  if (pathname.startsWith("/library")) return "Browsing library"
  if (pathname.startsWith("/explore")) return "Exploring music"
  return "Browsing YouTube Music"
}

presence.on("UpdateData", async (ctx) => {
  try {
    const privacy = isEnabled(ctx.settings.privacy)
    const showButtons = !("showButtons" in ctx.settings) || isEnabled(ctx.settings.showButtons)
    const showBrowsing = isEnabled(ctx.settings.showBrowsing)
    const playerBar = findPlayerBar()
    const video = findVideo()
    const track = getCurrentTrack(playerBar, video)

    if (track) {
      const data: PresenceData = {
        details: privacy ? "Listening to music" : track.title,
        state: privacy ? undefined : track.artist,
        largeImageKey: Assets.Logo,
        largeImageText: privacy ? "YouTube Music" : track.title,
        smallImageKey: track.playing ? "play" : "pause",
        smallImageText: track.playing ? "Playing" : "Paused",
        type: PresenceType.Listening,
        ...createProgressTimestamps(video, track),
      }

      if (!privacy) {
        data.largeImageKey = await toDiscordImage(track.artwork) ?? Assets.Logo
      }

      if (!privacy && showButtons) {
        data.buttons = [{ label: "Listen", url: track.url }]
      }

      await presence.setActivity(data)
      return
    }

    if (!showBrowsing) {
      presence.clearActivity()
      return
    }

    await presence.setActivity({
      details: browsingDetails(document.location.pathname),
      state: document.location.pathname.startsWith("/search")
        ? new URLSearchParams(document.location.search).get("q") ?? undefined
        : undefined,
      largeImageKey: Assets.Logo,
      largeImageText: "YouTube Music",
      type: PresenceType.Listening,
    })
  } catch (err) {
    presence.error(`YouTube Music presence error: ${err}`)
    await presence.setActivity({
      details: "YouTube Music",
      largeImageKey: Assets.Logo,
      type: PresenceType.Listening,
    })
  }
})