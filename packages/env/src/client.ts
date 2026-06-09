import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const clientEnv = createEnv({
  server: {
    PRESENCE_API_URL: z.string().trim().url().default("https://api.nowly.me"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().trim().url().default("https://api.nowly.me"),
    NEXT_PUBLIC_BASE_URL: z.string().trim().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    PRESENCE_API_URL: process.env.PRESENCE_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
})
