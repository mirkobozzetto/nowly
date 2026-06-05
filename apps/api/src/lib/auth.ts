import crypto from "crypto"
import jwt from "jsonwebtoken"
import "dotenv/config"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
const ANONYMOUS_HASH_SECRET = process.env.ANONYMOUS_HASH_SECRET || "fallback-anonymous-hash"

export interface DiscordUser {
  discordId: string
  username: string
  globalName: string
  avatar: string | null
  avatar_url: string | null
}

export const signToken = (user: DiscordUser): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "30d" })
}

export const verifyToken = (token: string): DiscordUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DiscordUser
  } catch {
    return null
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL

export const hashDiscordId = (discordId: string): string => {
  return crypto.createHmac("sha256", ANONYMOUS_HASH_SECRET).update(discordId).digest("hex")
}

export const isValidRedirect = (redirect: string, origin?: string): boolean => {
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return true
  if (FRONTEND_URL && redirect.startsWith(FRONTEND_URL)) return true
  if (origin && redirect.startsWith(origin)) return true
  return false
}
