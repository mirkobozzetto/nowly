import { cleanUploader, cleanTitle } from "./text"
import { $, text } from "./dom"
import { findUploaderFromData, findUploaderFromMeta } from "./youtube-data"

export const findTitle = (): string =>
  $("yt-shorts-video-title-view-model .ytAttributedStringHost")?.textContent?.trim()
  || $("h1 yt-formatted-string")?.textContent?.trim()
  || $("h1 .ytAttributedStringHost")?.textContent?.trim()
  || $("h1")?.textContent?.trim()
  || document.title.replace(" - YouTube", "")
  || "YouTube"

export const findUploader = (videoId?: string): string | undefined =>
  cleanUploader($("#owner #attributed-channel-name")?.textContent?.trim())
  || cleanUploader($("#owner ytd-channel-name a")?.textContent?.trim())
  || cleanUploader($("#owner yt-formatted-string a")?.textContent?.trim())
  || cleanUploader($("#owner #channel-name a")?.textContent?.trim())
  || cleanUploader($("#owner-container a")?.textContent?.trim())
  || cleanUploader($("ytd-video-owner-renderer a[href^='/@']")?.textContent?.trim())
  || cleanUploader($("ytd-video-owner-renderer #attributed-channel-name")?.textContent?.trim())
  || cleanUploader($("ytd-video-owner-renderer ytd-channel-name a")?.textContent?.trim())
  || cleanUploader($("yt-content-metadata-view-model a[href^='/@']")?.textContent?.trim())
  || cleanUploader($("ytd-watch-metadata a[href^='/@']")?.textContent?.trim())
  || findUploaderFromData(videoId)
  || findUploaderFromMeta()
  || cleanUploader($("yt-reel-channel-bar-view-model .ytAttributedStringHost a")?.textContent?.trim())
  || cleanUploader($(".ytReelChannelBarViewModelChannelName a")?.textContent?.trim())
  || cleanUploader($("ytd-reel-player-overlay-renderer ytd-channel-name a")?.textContent?.trim())
  || cleanUploader($("ytd-reel-video-renderer #channel-name a")?.textContent?.trim())
  || cleanUploader($("ytd-channel-name a")?.textContent?.trim())
  || cleanUploader($(".ytd-channel-name a")?.textContent?.trim())

export const getChannelName = (): string | undefined => {
  const title = document.title.replace(" - YouTube", "").trim()
  return title || undefined
}

export const getChannelAvatar = (): string | undefined => {
  const img = $<HTMLImageElement>("#page-header yt-img-shadow img, ytd-tabbed-page-header yt-img-shadow img, ytd-c4-header yt-img-shadow img")
  return img?.src || undefined
}

export const getChannelSubscribers = (): string | undefined => {
  const el = $("#subscriber-count") ?? $("#owner-sub-count") ?? $("yt-formatted-string#subscriber-count")
  return text(el)
}
