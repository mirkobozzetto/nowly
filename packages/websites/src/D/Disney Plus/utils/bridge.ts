export type DisneyPlayerData = {
  imageId?: string
  title?: string
  subtitle?: string
}

let disneyData: DisneyPlayerData = {}

window.addEventListener("message", (e) => {
  if (e.data.type === "nowly-disney-data") {
    disneyData = {
      imageId: e.data.imageId,
      title: e.data.title,
      subtitle: e.data.subtitle,
    }
  }
})

export const installDisneyBridge = (): void => {
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
}

export const getDisneyPlayerData = (): DisneyPlayerData => disneyData