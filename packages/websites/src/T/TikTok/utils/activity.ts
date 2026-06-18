import { createMediaTimestamps, PresenceType, type PresenceData, type PresenceInstance, type UpdateDataContext } from "@nowly/presence"
import { extractLiveCategoryImage, extractLiveCategoryName, extractLiveCategoryPath } from "./category"
import { findPlayingVideo, getVideo, getVideoState } from "./media"
import { extractProfileAvatar, extractProfileInfo } from "./profile"
import { toDiscordImage } from "./proxy"
import {
  extractHandle,
  extractNickname,
  extractPoster,
  extractSingleVideoAuthor,
  extractVideoDescription,
  extractVideoId,
  extractVideoPagePath,
} from "./video"

type TikTokSettings = {
  privacy?: unknown
  showButtons?: unknown
  showProfileUsernames?: unknown
}

const isFeedPath = (pathname: string, lang?: string | null): boolean =>
  pathname === "/following"
  || pathname.includes("foryou")
  || pathname === "/"
  || pathname === ""
  || Boolean(lang && (pathname === `/${lang}` || pathname === `/${lang}/`))

const isEnabled = (value: unknown): boolean => value === true

export const handleUpdate = async (
  presence: PresenceInstance,
  ctx: UpdateDataContext<TikTokSettings>,
): Promise<void> => {
  try {
    const { pathname, href } = document.location
    const lang = document.querySelector("html")?.getAttribute("lang")
    const privacy = isEnabled(ctx.settings.privacy)
    const showButtons = ctx.settings.showButtons !== false
    const showProfileUsernames = ctx.settings.showProfileUsernames !== false

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
}
