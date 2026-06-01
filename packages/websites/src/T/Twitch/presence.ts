import type { PresenceFactory } from "../../types"

const presence = (): PresenceFactory => ({
  init: async () => {},
  tick: async () => null,
  destroy: async () => {},
})

export default presence
