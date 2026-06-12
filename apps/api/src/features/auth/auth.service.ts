import crypto from "crypto"
import { serverEnv } from "@nowly/env/server"
import "dotenv/config"
import jwt from "jsonwebtoken"

export interface DiscordUser {
  discordId: string
  username: string
  globalName: string
  avatar: string | null
  avatar_url: string | null
}

export const signToken = (user: DiscordUser): string => {
  return jwt.sign(user, serverEnv.JWT_SECRET, { expiresIn: "30d" })
}

export const verifyToken = (token: string): DiscordUser | null => {
  try {
    return jwt.verify(token, serverEnv.JWT_SECRET) as DiscordUser
  } catch {
    return null
  }
}

export const hashDiscordId = (discordId: string): string => {
  return crypto.createHmac("sha256", serverEnv.ANONYMOUS_HASH_SECRET).update(discordId).digest("hex")
}

export const isValidRedirect = (redirect: string, origin?: string): boolean => {
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return true
  if (serverEnv.FRONTEND_URL && redirect.startsWith(serverEnv.FRONTEND_URL)) return true
  if (origin && redirect.startsWith(origin)) return true
  return false
}
