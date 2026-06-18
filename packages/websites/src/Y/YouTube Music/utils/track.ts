import type { PresenceData } from "@nowly/presence"
import { findArtwork } from "./artwork"
import { attr, cleanArtist, cleanTrackTitle, text } from "./text"

const TRACK_STALE_MS = 15_000

export type TrackInfo = {
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

export const findPlayerBar = (): Element | null =>
  document.querySelector("ytmusic-player-bar")
  ?? document.querySelector("#player-bar")

export const findVideo = (): HTMLVideoElement | null =>
  document.querySelector<HTMLVideoElement>("video.html5-main-video")
  ?? document.querySelector<HTMLVideoElement>("#movie_player video")
  ?? document.querySelector<HTMLVideoElement>("video")

const findTitle = (playerBar: Element | null): string | undefined => {
  const root = playerBar ?? document
  return cleanTrackTitle(navigator.mediaSession.metadata?.title)
    ?? cleanTrackTitle(root.querySelector(".title.ytmusic-player-bar")?.textContent)
    ?? cleanTrackTitle(root.querySelector(".content-info-wrapper .title")?.textContent)
    ?? cleanTrackTitle(root.querySelector("yt-formatted-string.title")?.textContent)
}

const findByline = (playerBar: Element | null): string | undefined =>
  text(".byline.ytmusic-player-bar", playerBar ?? document)
  ?? text(".subtitle.ytmusic-player-bar", playerBar ?? document)
  ?? text(".content-info-wrapper .byline", playerBar ?? document)

const findArtist = (playerBar: Element | null): string | undefined => {
  const mediaSessionArtist = cleanArtist(navigator.mediaSession.metadata?.artist)
  if (mediaSessionArtist) return mediaSessionArtist

  const byline = findByline(playerBar)
  if (!byline || /^youtube music$/i.test(byline)) return undefined
  return byline
    .split(/\s+(?:\u2022|\u00b7)\s+/)
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

export const createProgressTimestamps = (
  video: HTMLVideoElement | null,
  track: TrackInfo,
): Pick<PresenceData, "startTimestamp" | "endTimestamp"> => {
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

export const getCurrentTrack = (playerBar: Element | null, video: HTMLVideoElement | null): TrackInfo | undefined => {
  const previousTrack = lastTrack
  const title = findTitle(playerBar)
  const url = findTrackUrl(playerBar)
  const playing = isPlaying(video, playerBar)
  const currentTime = Number.isFinite(video?.currentTime) ? video?.currentTime : undefined
  const duration = Number.isFinite(video?.duration) ? video?.duration : undefined

  if (!title) {
    if (lastTrack && Date.now() - lastTrack.updatedAt < TRACK_STALE_MS) {
      lastTrack = {
        ...lastTrack,
        playing,
        currentTime: currentTime ?? lastTrack.currentTime,
        duration: duration ?? lastTrack.duration,
      }
      return lastTrack
    }
    return undefined
  }

  const artist = findArtist(playerBar)
  const shouldKeepPreviousArtist = previousTrack
    && previousTrack.title === title
    && (!artist || artist === "YouTube Music")

  const track: TrackInfo = {
    title,
    artist: shouldKeepPreviousArtist ? previousTrack.artist : artist,
    artwork: findArtwork(playerBar),
    url,
    playing,
    currentTime,
    duration,
    updatedAt: Date.now(),
  }

  lastTrack = track
  return track
}