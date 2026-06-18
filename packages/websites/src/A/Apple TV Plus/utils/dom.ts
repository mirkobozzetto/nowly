export const $ = <T extends Element = Element>(selector: string, parent?: Element): T | null =>
  (parent ? parent.querySelector(selector) : document.querySelector(selector)) as T | null

export const text = (el: Element | null | undefined): string | undefined =>
  el?.textContent?.trim() || undefined

export const findVideo = (): HTMLVideoElement | undefined =>
  $("video") as HTMLVideoElement | undefined

export const hasPlayerTabs = (): boolean =>
  Boolean($(".video-player__tabs"))