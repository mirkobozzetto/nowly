import { createMediaTimestamps, PresenceType } from "@nowly/presence"

let disneyImageId: string | undefined
let disneyTitle: string | undefined
let disneySubtitle: string | undefined

window.addEventListener("message", (e) => {
  if (e.data.type === "nowly-disney-data") {
    disneyImageId = e.data.imageId
    disneyTitle = e.data.title
    disneySubtitle = e.data.subtitle
  }
})

const script = document.createElement("script")
script.textContent = `
setInterval(() => {
  const el = document.querySelector("disney-web-player");
  const metadata = el?.mediaPlayer?.mediaPlaybackCriteria?.metadata;
  const images = metadata?.images_experience?.standard?.tile;
  if (!images) return;
  const ratios = Object.keys(images);
  const closest = ratios.reduce((a, b) => Math.abs(100 / a - 100) < Math.abs(100 / b - 100) ? a : b);
  window.postMessage({
    type: "nowly-disney-data",
    imageId: images[closest]?.imageId,
    title: metadata?.title?.text,
    subtitle: metadata?.subtitle?.text,
  }, "*");
}, 1000);
`
document.head.appendChild(script)

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

const findEntityTitle = (): string | undefined => {
  const img = document.querySelector<HTMLImageElement>('[data-testid="details-title-treatment"] img')
  if (img?.alt) return img.alt

  const title = document.title.split("|")[0]?.trim()
  return title || undefined
}

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location
  const video = findVideo()

  if (pathname.includes("/play/") && video && disneyImageId) {
    const largeImageKey = `https://disney.images.edge.bamgrid.com/ripcut-delivery/v2/variant/disney/${disneyImageId}/compose?format=png&width=512`

    const episodeMatch = disneySubtitle?.match(/S(\d+):E(\d+)\s+(.*)/)
    const state = episodeMatch
      ? `S${episodeMatch[1]}.E${episodeMatch[2]} ${episodeMatch[3]?.trim() || ""}`.trim()
      : disneySubtitle

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: disneyTitle || "Disney+",
      state,
      largeImageKey,
      largeImageText: disneyTitle || "Disney+",
      type: PresenceType.Watching,
      buttons: [{
        label: episodeMatch ? "Watch Episode" : "Watch Movie",
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
    const title = findEntityTitle()
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
