import { createMediaTimestamps, PresenceType, type PresenceData } from "@nowly/presence"
import { extractLiveCategoryImage, extractLiveCategoryName, extractLiveCategoryPath } from "./utils/category"
import { findPlayingVideo, getVideo, getVideoState } from "./utils/media"
import { extractProfileAvatar, extractProfileInfo } from "./utils/profile"
import { toDiscordImage } from "./utils/proxy"
import {
  extractHandle,
  extractNickname,
  extractPoster,
  extractSingleVideoAuthor,
  extractVideoDescription,
  extractVideoId,
  extractVideoPagePath,
} from "./utils/video"

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
      "en-US": "Hide all details about the content you're watching.",
      "fr-FR": "Cache tous les détails du contenu que vous regardez.",
      "es-ES": "Oculta todos los detalles del contenido que estás viendo.",
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
      "en-US": "Show action buttons (view video, view profile) in your presence.",
      "fr-FR": "Affiche les boutons d'action (voir la vidéo, voir le profil) dans votre présence.",
      "es-ES": "Muestra botones de acción (ver video, ver perfil) en tu presencia.",
    },
  },
  showProfileUsernames: {
    type: "boolean",
    default: true,
    label: {
      "en-US": "Show profile info",
      "fr-FR": "Afficher les infos du profil",
      "es-ES": "Mostrar información del perfil",
    },
    description: {
      "en-US": "Show profile usernames when browsing profiles.",
      "fr-FR": "Affiche les noms d'utilisateur lors de la navigation sur les profils.",
      "es-ES": "Muestra los nombres de usuario al navegar por los perfiles.",
    },
  },
})

const presence = new Presence(settings)

const isFeedPath = (pathname: string, lang?: string | null): boolean =>
  pathname === "/following"
  || pathname.includes("foryou")
  || pathname === "/"
  || pathname === ""
  || Boolean(lang && (pathname === `/${lang}` || pathname === `/${lang}/`))

presence.on("UpdateData", async (ctx) => {
  try {
    const { pathname, href } = document.location
    const lang = document.querySelector("html")?.getAttribute("lang")
    const { privacy, showButtons, showProfileUsernames } = ctx.settings

    if (isFeedPath(pathname, lang)) {
      const playing = findPlayingVideo()
      const video = playing ? getVideo(playing) : getVideo(null)
      const container = video?.closest("[data-e2e=\"recommend-list-item-container\"]")

      const handle = container ? extractHandle(container) : undefined
      const nickname = container ? extractNickname(container) : undefined
      const videoId = video ? extractVideoId(video) : undefined
      const tiktokURL = handle && videoId ? `https://www.tiktok.com/@${handle}/video/${videoId}` : undefined
      const creatorURL = handle ? `https://www.tiktok.com/@${handle}/` : undefined
      const paused = video?.paused ?? false
      const poster = !privacy ? await toDiscordImage(extractPoster(video)) : undefined

      const data: PresenceData = {
        largeImageKey: poster ?? Assets.Logo,
        smallImageKey: paused ? "pause" : "play",
        smallImageText: paused ? "Paused" : "Playing",
        type: PresenceType.Watching,
      }

      if (privacy) {
        data.details = "Browsing feed"
      } else if (nickname && handle) {
        data.details = `${nickname} (@${handle})`
        data.state = extractVideoDescription(container)
      } else if (video) {
        data.details = "Watching a video"
      } else {
        data.details = "Browsing feed"
      }

      if (!privacy && showButtons) {
        const buttons = []
        if (tiktokURL && creatorURL) {
          buttons.push(
            { label: "View TikTok", url: tiktokURL },
            { label: "View Profile", url: creatorURL },
          )
        } else if (creatorURL) {
          buttons.push({ label: "View Profile", url: creatorURL })
        } else if (tiktokURL) {
          buttons.push({ label: "View TikTok", url: tiktokURL })
        }
        if (buttons.length > 0) data.buttons = buttons
      }

      if (video && !paused && video.duration && video.currentTime) {
        Object.assign(data, createMediaTimestamps(video))
      }

      await presence.setActivity(data)
      return
    }

    if (pathname.includes("/video/")) {
      const vidEl = document.querySelector("video")
      const video = getVideoState(vidEl)
      const author = extractSingleVideoAuthor()
      const videoPath = extractVideoPagePath(pathname)
      const handle = author.handle ?? videoPath?.handle
      const videoId = videoPath?.videoId
      const poster = !privacy ? await toDiscordImage(extractPoster(vidEl)) : undefined

      const data: PresenceData = {
        largeImageKey: poster ?? Assets.Logo,
        smallImageKey: vidEl?.paused ? "pause" : "play",
        smallImageText: vidEl?.paused ? "Paused" : "Playing",
        type: PresenceType.Watching,
      }

      if (privacy) {
        data.details = "Watching a video"
      } else {
        data.details = author.nickname ? `${author.nickname} (@${handle})` : "Watching a video"
        data.state = extractVideoDescription()
      }

      if (!video.paused) {
        Object.assign(data, createMediaTimestamps({
          currentTime: video.currentTime,
          duration: video.duration,
          paused: false,
        }))
      }

      if (!privacy && showButtons && handle) {
        data.buttons = [
          { label: "View TikTok", url: href },
          { label: "View Profile", url: `https://www.tiktok.com/@${handle}` },
        ]
      }

      await presence.setActivity(data)
      return
    }

    const liveCategory = extractLiveCategoryPath(pathname)
    if (liveCategory) {
      const category = extractLiveCategoryName(liveCategory.category)
      const image = !privacy ? await toDiscordImage(extractLiveCategoryImage()) : undefined

      const data: PresenceData = {
        largeImageKey: image ?? Assets.Logo,
        largeImageText: category ?? "TikTok Live",
        smallImageKey: image ? Assets.Logo : undefined,
        smallImageText: image ? "TikTok" : undefined,
        type: PresenceType.Watching,
        details: privacy
          ? "Browsing live categories"
          : category
            ? `Browsing ${category}`
            : "Browsing live category",
      }

      if (!privacy && showButtons) {
        data.buttons = [{ label: "View Category", url: href.split("?")[0] }]
      }

      await presence.setActivity(data)
      return
    }

    if (pathname === "/live") {
      await presence.setActivity({
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
        details: "Watching a live stream",
      })
      return
    }

    if (pathname.includes("/live")) {
      const author = extractSingleVideoAuthor()

      const data: PresenceData = {
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
      }

      if (privacy) {
        data.details = "Watching a live stream"
      } else if (author.nickname && author.handle) {
        data.details = `Watching live - ${author.nickname} (@${author.handle})`
      } else {
        data.details = "Watching a live stream"
      }

      if (!privacy && showButtons && author.handle) {
        data.buttons = [
          { label: "Watch Stream", url: href },
          { label: "View Profile", url: `https://www.tiktok.com/@${author.handle}` },
        ]
      }

      await presence.setActivity(data)
      return
    }

    if (pathname.includes("/@")) {
      const { username, displayName, bio } = extractProfileInfo()
      const avatar = !privacy ? await toDiscordImage(extractProfileAvatar()) : undefined

      const data: PresenceData = {
        largeImageKey: avatar ?? Assets.Logo,
        smallImageKey: avatar ? Assets.Logo : undefined,
        smallImageText: avatar ? "TikTok" : undefined,
        type: PresenceType.Watching,
      }

      if (privacy || !showProfileUsernames) {
        data.details = "Viewing a profile"
      } else if (displayName && username) {
        data.details = `${displayName} (@${username})`
        data.state = bio
      } else if (username) {
        data.details = `@${username}`
        data.state = bio
      } else {
        data.details = "Viewing a profile"
      }

      if (showProfileUsernames && !privacy && showButtons && username) {
        data.buttons = [{ label: "View Profile", url: `https://www.tiktok.com/@${username}` }]
      }

      await presence.setActivity(data)
      return
    }

    if (pathname.includes("/explore")) {
      await presence.setActivity({
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
        details: privacy ? "Browsing explore" : "Exploring",
      })
      return
    }

    if (pathname.includes("/messages")) {
      await presence.setActivity({
        largeImageKey: Assets.Logo,
        type: PresenceType.Watching,
        details: privacy ? "Browsing messages" : "Reading messages",
      })
      return
    }

    await presence.setActivity({
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
      details: "TikTok",
    })
  } catch (err) {
    presence.error(`TikTok presence error: ${err}`)
    await presence.setActivity({
      largeImageKey: Assets.Logo,
      type: PresenceType.Watching,
      details: "TikTok",
    })
  }
})
