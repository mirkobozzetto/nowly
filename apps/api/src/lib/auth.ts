import crypto from "crypto"
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
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "30d" })
}

export const verifyToken = (token: string): DiscordUser | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as DiscordUser
  } catch {
    return null
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL

export const hashDiscordId = (discordId: string): string => {
  return crypto.createHmac("sha256", process.env.ANONYMOUS_HASH_SECRET!).update(discordId).digest("hex")
}

export const isValidRedirect = (redirect: string, origin?: string): boolean => {
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return true
  if (FRONTEND_URL && redirect.startsWith(FRONTEND_URL)) return true
  if (origin && redirect.startsWith(origin)) return true
  return false
}
