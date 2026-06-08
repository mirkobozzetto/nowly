import { isValidRedirect, signToken, verifyToken, type DiscordUser } from "@/lib/auth"
import { serverEnv } from "@nowly/env/server"
import "dotenv/config"
import type { FastifyInstance } from "fastify"

const discordAuth = async (request: any, reply: any) => {
  const redirect = (request.query as { redirect?: string }).redirect || "/"
  const origin = request.headers.origin as string | undefined
  if (!isValidRedirect(redirect, origin)) {
    return reply.status(400).send({ error: "Invalid redirect" })
  }

  const url = new URL("https://discord.com/api/oauth2/authorize")
  url.searchParams.set("client_id", serverEnv.DISCORD_CLIENT_ID)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("redirect_uri", serverEnv.DISCORD_REDIRECT_URI)
  url.searchParams.set("scope", "identify")
  url.searchParams.set("state", redirect)
  url.searchParams.set("prompt", "none")

  return reply.redirect(url.toString())
}

const discordCallback = async (request: any, reply: any) => {
  const query = request.query as { code?: string; state?: string }
  const code = query.code
  const redirect = isValidRedirect(query.state ?? "") ? query.state! : "/"

  if (!code) {
    return reply.redirect(`${redirect}?error=no_code`)
  }

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: serverEnv.DISCORD_CLIENT_ID,
      client_secret: serverEnv.DISCORD_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: serverEnv.DISCORD_REDIRECT_URI,
    }),
  })

  if (!tokenRes.ok) {
    return reply.redirect(`${redirect}?error=token_exchange_failed`)
  }

  const tokenData = (await tokenRes.json()) as { access_token: string }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userRes.ok) {
    return reply.redirect(`${redirect}?error=user_fetch_failed`)
  }

  const discordUser = (await userRes.json()) as {
    id: string
    username: string
    global_name: string | null
    avatar: string | null
  }

  const user: DiscordUser = {
    discordId: discordUser.id,
    username: discordUser.username,
    globalName: discordUser.global_name ?? discordUser.username,
    avatar: discordUser.avatar,
    avatar_url: discordUser.avatar,
  }

  const token = signToken(user)

  return reply.redirect(`${redirect}?token=${token}`)
}

const me = async (request: any, reply: any) => {
  const auth = request.headers.authorization
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid token" })
  }

  const user = verifyToken(auth.slice(7))
  if (!user) {
    return reply.status(401).send({ error: "Invalid or expired token" })
  }

  return user
}

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/discord", discordAuth)
  fastify.get("/discord/callback", discordCallback)
  fastify.get("/me", me)
}