import { getPrisma, hasDatabase } from "@/db/client"
import { serverEnv } from "@nowly/env/server"
import { Prisma } from "../../generated/prisma/client"
import { createHmac, randomBytes, randomUUID } from "node:crypto"

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_PREFIX = "NOWLY"

export type RedeemResult =
  | { ok: true; adFree: true; deviceCount: number; maxDevices: number }
  | { ok: false; error: "invalid_code" | "inactive_code" | "device_limit_reached" | "database_unavailable"; maxDevices?: number }

export type CreateSupporterPassInput = {
  provider?: string
  providerRef?: string
  maxDevices?: number
}

export type DonationEventInput = {
  provider: string
  providerEventId: string
  amount?: string
  currency?: string
  donorEmail?: string
  donorName?: string
  donorLogin?: string
  payload?: Record<string, unknown>
}

const cleanText = (value: unknown, max = 160): string | undefined => {
  if (typeof value !== "string") return undefined
  const clean = value.trim()
  if (!clean) return undefined
  return clean.slice(0, max)
}

const cleanProvider = (value: unknown): string => cleanText(value, 40)?.toLowerCase() ?? "manual"

const cleanJson = (value: Record<string, unknown> = {}): Prisma.InputJsonObject => {
  const allowed = new Set([
    "id",
    "type",
    "amount",
    "currency",
    "tier",
    "is_public",
    "message_id",
    "from_name",
    "github_login",
    "sponsor_login",
    "action",
  ])

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => allowed.has(key))
      .map(([key, val]) => [key, typeof val === "string" ? cleanText(val, 240) : val])
      .filter(([, val]) => typeof val === "string" || typeof val === "number" || typeof val === "boolean"),
  ) as Prisma.InputJsonObject
}

export const normalizeSupporterCode = (code: string): string =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, "")

export const hashSupporterCode = (code: string): string =>
  createHmac("sha256", serverEnv.ANONYMOUS_HASH_SECRET)
    .update(`supporter-pass:v1:${normalizeSupporterCode(code)}`)
    .digest("hex")

const hashEmail = (email: string | undefined): string | undefined => {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return undefined
  return createHmac("sha256", serverEnv.ANONYMOUS_HASH_SECRET)
    .update(`supporter-email:v1:${normalized}`)
    .digest("hex")
}

const randomSegment = (length: number): string => {
  const bytes = randomBytes(length)
  let out = ""
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  return out
}

export const generateSupporterCode = (): string =>
  `${CODE_PREFIX}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`

export const createSupporterPass = async (input: CreateSupporterPassInput = {}): Promise<{
  id: string
  code: string
  maxDevices: number
}> => {
  const code = generateSupporterCode()
  const id = randomUUID()
  const maxDevices = input.maxDevices ?? serverEnv.SUPPORT_PASS_DEFAULT_MAX_DEVICES

  await getPrisma().supporterPass.create({
    data: {
      id,
      codeHash: hashSupporterCode(code),
      provider: cleanProvider(input.provider),
      providerRef: cleanText(input.providerRef),
      maxDevices,
    },
  })

  return { id, code, maxDevices }
}

export const recordDonationAndCreatePass = async (input: DonationEventInput): Promise<{
  created: boolean
  code?: string
  passId?: string | null
}> => {
  if (!hasDatabase()) return { created: false }

  const prisma = getPrisma()
  const provider = cleanProvider(input.provider)
  const providerEventId = cleanText(input.providerEventId, 180)
  if (!providerEventId) return { created: false }

  const existing = await prisma.donationEvent.findUnique({
    where: { provider_providerEventId: { provider, providerEventId } },
    select: { passId: true },
  })
  if (existing) return { created: false, passId: existing.passId }

  const pass = await createSupporterPass({ provider, providerRef: providerEventId })

  await prisma.donationEvent.create({
    data: {
      id: randomUUID(),
      provider,
      providerEventId,
      passId: pass.id,
      amount: cleanText(input.amount, 40),
      currency: cleanText(input.currency, 12)?.toUpperCase(),
      donorEmailHash: hashEmail(input.donorEmail),
      donorName: cleanText(input.donorName, 120),
      donorLogin: cleanText(input.donorLogin, 120),
      payload: cleanJson(input.payload),
    },
  })

  return { created: true, code: pass.code, passId: pass.id }
}

export const hasAdFreeAccess = async (deviceId: string | undefined): Promise<boolean> => {
  const cleanDeviceId = cleanText(deviceId, 120)
  if (!cleanDeviceId || !hasDatabase()) return false

  const count = await getPrisma().supporterDevice.count({
    where: {
      deviceId: cleanDeviceId,
      pass: { status: "active" },
    },
  })
  return count > 0
}

export const verifySupporterCode = async (code: string): Promise<{ valid: boolean; maxDevices?: number }> => {
  if (!hasDatabase()) return { valid: false }

  const pass = await getPrisma().supporterPass.findUnique({
    where: { codeHash: hashSupporterCode(code) },
    select: { status: true, maxDevices: true },
  })

  if (!pass) return { valid: false }
  if (pass.status !== "active") return { valid: false }

  return { valid: true, maxDevices: pass.maxDevices }
}

export const redeemSupporterCodeForDevice = async (code: string, deviceId: string): Promise<RedeemResult> => {
  const cleanDeviceId = cleanText(deviceId, 120)
  if (!cleanDeviceId || !hasDatabase()) return { ok: false, error: "database_unavailable" }

  const prisma = getPrisma()
  const pass = await prisma.supporterPass.findUnique({
    where: { codeHash: hashSupporterCode(code) },
    include: { devices: true },
  })

  if (!pass) return { ok: false, error: "invalid_code" }
  if (pass.status !== "active") return { ok: false, error: "inactive_code" }

  const existingDevice = pass.devices.find((device) => device.deviceId === cleanDeviceId)
  if (existingDevice) {
    await prisma.supporterDevice.update({
      where: { passId_deviceId: { passId: pass.id, deviceId: cleanDeviceId } },
      data: { lastSeenAt: new Date() },
    })
    return { ok: true, adFree: true, deviceCount: pass.devices.length, maxDevices: pass.maxDevices }
  }

  if (pass.devices.length >= pass.maxDevices) {
    return { ok: false, error: "device_limit_reached", maxDevices: pass.maxDevices }
  }

  await prisma.supporterDevice.create({
    data: {
      passId: pass.id,
      deviceId: cleanDeviceId,
    },
  })

  return { ok: true, adFree: true, deviceCount: pass.devices.length + 1, maxDevices: pass.maxDevices }
}
