import { PresenceType, type PresenceData } from "@nowly/presence"
import { toDiscordImage } from "./utils/proxy"
import { createProgressTimestamps, findPlayerBar, findVideo, getCurrentTrack } from "./utils/track"

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

const isEnabled = (value: unknown): boolean => value === true || value === "true"

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
        data.largeImageKey = toDiscordImage(track.artwork) ?? Assets.Logo
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
