// Background service worker
// Gère le stockage des présences et la communication Native Messaging

const NATIVE_HOST = "fr.DP_PROJECT_NAME.client"

interface PresenceData {
  details?: string
  state?: string
  startTimestamp?: number
  endTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
  buttons?: { label: string; url: string }[]
}

let nativePort: chrome.runtime.Port | null = null

// Connexion au Native Host
function connectNative() {
  if (nativePort) return

  try {
    nativePort = chrome.runtime.connectNative(NATIVE_HOST)

    nativePort.onMessage.addListener((msg) => {
      console.log("[Presence] Native host message:", msg)
    })

    nativePort.onDisconnect.addListener(() => {
      console.log("[Presence] Native host disconnected")
      nativePort = null
    })

    console.log("[Presence] Connected to native host")
  } catch (err) {
    console.error("[Presence] Failed to connect native host:", err)
  }
}

// Envoyer une activité au Native Host
function sendActivity(presence: PresenceData) {
  connectNative()
  if (!nativePort) return

  nativePort.postMessage({
    type: "SET_ACTIVITY",
    presence: {
      details: presence.details ?? "",
      state: presence.state ?? "",
      startTime: presence.startTimestamp ?? 0,
      largeImage: presence.largeImageKey ?? "",
      largeText: presence.largeImageText ?? "",
    },
  })
}

// Effacer l'activité
function clearActivity() {
  if (!nativePort) return
  nativePort.postMessage({ type: "CLEAR_ACTIVITY" })
}

// Écouter les messages du content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "SET_ACTIVITY":
      sendActivity(message.presence)
      sendResponse({ status: "ok" })
      break

    case "CLEAR_ACTIVITY":
      clearActivity()
      sendResponse({ status: "ok" })
      break

    case "PING":
      sendResponse({ status: "ok", version: "1.0.0" })
      break
  }
})

// Écouter les messages du site web (install toggle)
chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    if (message.type === "INSTALL_PRESENCE") {
      chrome.storage.local.get("presences", (result) => {
        const presences = result.presences ?? {}
        presences[message.slug] = message.enable
        chrome.storage.local.set({ presences }, () => {
          sendResponse({ status: "ok" })
        })
      })
      return true // keep channel open for async response
    }

    if (message.type === "GET_INSTALLED") {
      chrome.storage.local.get("presences", (result) => {
        sendResponse({ presences: result.presences ?? {} })
      })
      return true
    }
  }
)

// Connexion native au démarrage
connectNative()
