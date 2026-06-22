import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const required = z.string().trim().min(1)

export const serverEnv = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_URL: z.string().trim().url().default("http://localhost:3000"),
    DATABASE_URL: required.optional(),
    JWT_SECRET: required,
    ANONYMOUS_HASH_SECRET: required,
    DISCORD_CLIENT_ID: required,
    DISCORD_CLIENT_SECRET: required,
    DISCORD_REDIRECT_URI: z.string().trim().url(),
    PRESENCE_SIGNING_PRIVATE_KEY: required,
    API_SECRET_KEY: required.optional(),
    ANALYTICS_ALLOWED_DISCORD_IDS: z.string().trim().optional(),
    DEVICE_TOKEN_SECRET: required.optional(),
    OPENAI_API_KEY: required.optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true",
})
