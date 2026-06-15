import { isValidRedirect, signToken, verifyToken, type DiscordUser } from "./auth.service"
import { serverEnv } from "@nowly/env/server"
import { randomBytes } from "crypto"
import "dotenv/config"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

const OAUTH_STATE_COOKIE = "nowly_oauth_state"
const OAUTH_STATE_MAX_AGE_SECONDS = 600

const parseCookies = (header: string | undefined): Record<string, string> => {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(";")) {
    const idx = part.indexOf("=")
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    if (key) out[key] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}

const isSecureRequest = (request: FastifyRequest): boolean =>
  request.protocol === "https" || serverEnv.DISCORD_REDIRECT_URI.startsWith("https://")

const setStateCookie = (request: FastifyRequest, reply: FastifyReply, nonce: string): void => {
  const attrs = [
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(nonce)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`,
  ]
  if (isSecureRequest(request)) attrs.push("Secure")
  reply.header("Set-Cookie", attrs.join("; "))
}

const clearStateCookie = (reply: FastifyReply): void => {
  reply.header("Set-Cookie", `${OAUTH_STATE_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`)
}

// SEC-03: the OAuth `state` carries the redirect plus a random nonce. The nonce
// is mirrored in an HttpOnly cookie and re-checked on the callback, so a forged
// authorization request that the victim did not initiate is rejected.
const encodeState = (redirect: string, nonce: string): string =>
  Buffer.from(JSON.stringify({ r: redirect, n: nonce })).toString("base64url")

const decodeState = (state: string | undefined): { r: string; n: string } | null => {
  if (!state) return null
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { r?: unknown; n?: unknown }
    if (typeof parsed.r === "string" && typeof parsed.n === "string") return { r: parsed.r, n: parsed.n }
    return null
  } catch {
    return null
  }
}

const discordAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const redirect = (request.query as { redirect?: string }).redirect || "/"
  const origin = request.headers.origin as string | undefined
  if (!isValidRedirect(redirect, origin)) {
    return reply.status(400).send({ error: "Invalid redirect" })
  }

  const nonce = randomBytes(24).toString("base64url")
  setStateCookie(request, reply, nonce)

  const url = new URL("https://discord.com/api/oauth2/authorize")
  url.searchParams.set("client_id", serverEnv.DISCORD_CLIENT_ID)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("redirect_uri", serverEnv.DISCORD_REDIRECT_URI)
  url.searchParams.set("scope", "identify")
  url.searchParams.set("state", encodeState(redirect, nonce))
  url.searchParams.set("prompt", "none")

  return reply.redirect(url.toString())
}

const discordCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  const query = request.query as { code?: string; state?: string }
  const fallbackRedirect = serverEnv.FRONTEND_URL || "/"

  // SEC-03: validate the state/nonce pair before trusting anything else.
  const state = decodeState(query.state)
  const cookieNonce = parseCookies(request.headers.cookie)[OAUTH_STATE_COOKIE]
  clearStateCookie(reply)

  if (!state || !cookieNonce || state.n !== cookieNonce) {
    return reply.redirect(`${fallbackRedirect}?error=invalid_state`)
  }

  const redirect = isValidRedirect(state.r) ? state.r : fallbackRedirect

  const code = query.code
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

  // SEC-01: deliver the JWT in the URL fragment instead of the query string.
  // Fragments are never sent to the server (no access/proxy logs) and are not
  // included in the Referer header on subsequent navigation.
  return reply.redirect(`${redirect}#token=${token}`)
}

const me = async (request: FastifyRequest, reply: FastifyReply) => {
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

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(authRoutes, { prefix: "/auth" })
}
