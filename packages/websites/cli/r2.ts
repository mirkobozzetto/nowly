import { DIST } from "@/discover"
import { logger, spinner } from "@/logger"
import { CopyObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { cliEnv } from "@nowly/env/cli"
import { createHash } from "crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"

const R2_BUCKET = cliEnv.R2_BUCKET
const R2_PUBLIC_URL = cliEnv.R2_PUBLIC_URL
const CLOUDFLARE_API_TOKEN = cliEnv.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ZONE_ID = cliEnv.CLOUDFLARE_ZONE_ID

const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".ts": "text/typescript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".exe": "application/vnd.microsoft.portable-executable",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".dmg": "application/x-apple-diskimage",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
}

const getContentType = (path: string): string => {
  const ext = path.match(/\.[^.]+$/)?.[0].toLowerCase()
  return MIME_TYPES[ext ?? ""] ?? "application/octet-stream"
}

const getCacheControl = (path: string, immutable = false): string => {
  if (immutable && path.endsWith(".js")) return "public, max-age=31536000, immutable"
  if (immutable && path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) return "public, max-age=31536000, immutable"
  if (path.endsWith(".js")) return "public, max-age=60"
  return "public, max-age=3600"
}

const sha256File = (path: string): string => {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

const putFile = async (key: string, filePath: string, cacheControl?: string): Promise<string> => {
  const client = getClient()
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: readFileSync(filePath),
    ContentType: getContentType(filePath),
    CacheControl: cacheControl ?? getCacheControl(filePath),
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

const putJson = async (key: string, value: unknown, cacheControl = "public, max-age=60"): Promise<string> => {
  const client = getClient()
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: JSON.stringify(value, null, 2),
    ContentType: "application/json; charset=utf-8",
    CacheControl: cacheControl,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

let s3Client: S3Client | null = null

const getClient = (): S3Client => {
  if (!s3Client) {
    const accessKeyId = cliEnv.R2_ACCESS_KEY_ID
    const secretAccessKey = cliEnv.R2_SECRET_ACCESS_KEY
    const accountId = cliEnv.R2_ACCOUNT_ID

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("R2 credentials not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env")
    }
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return s3Client
}

const walkDir = (dir: string): string[] => {
  const files: string[] = []
  const walk = (current: string) => {
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(current, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else files.push(fullPath)
    }
  }
  walk(dir)
  return files
}

const uploadFiles = async (slug: string, prefix: string, immutable = false): Promise<string[]> => {
  const presenceDir = join(DIST, "presences", slug)
  const files = walkDir(presenceDir)
  const uploaded: string[] = []
  const client = getClient()

  for (const filePath of files) {
    const relativePath = relative(presenceDir, filePath).replace(/\\/g, "/")
    const key = join(prefix, relativePath).replace(/\\/g, "/")
    const contentType = getContentType(filePath)
    const cacheControl = getCacheControl(filePath, immutable)

    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: readFileSync(filePath),
      ContentType: contentType,
      CacheControl: cacheControl,
    }))

    uploaded.push(`${R2_PUBLIC_URL}/${key}`)
  }

  return uploaded
}

const purgeCloudflareFiles = async (urls: string[]): Promise<void> => {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID || urls.length === 0) return

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: urls }),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Cloudflare purge failed (${res.status}): ${text || res.statusText}`)
  }
}

const archiveCurrentOnR2 = async (slug: string, oldVersion: string): Promise<number> => {
  const client = getClient()
  const prefix = `presences/${slug}/`
  const archived: string[] = []

  let continuationToken: string | undefined
  do {
    const list = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))

    const objects = (list.Contents ?? []).filter(c =>
      c.Key && !c.Key.startsWith(`${prefix}versions/`)
    )
    for (const obj of objects) {
      const relativeKey = obj.Key!.slice(prefix.length)
      if (!relativeKey) continue
      const destKey = `presences/${slug}/versions/${oldVersion}/${relativeKey}`
      await client.send(new CopyObjectCommand({
        Bucket: R2_BUCKET,
        CopySource: `${R2_BUCKET}/${obj.Key}`,
        Key: destKey,
      }))
      archived.push(destKey)
    }

    continuationToken = list.NextContinuationToken
  } while (continuationToken)

  return archived.length
}

export const uploadToR2 = async (slug: string, newVersion?: string, oldVersion?: string): Promise<string[]> => {
  const presenceDir = join(DIST, "presences", slug)
  if (!existsSync(presenceDir)) {
    throw new Error(`Presence dist not found: ${presenceDir}. Build it first.`)
  }

  const s = spinner

  s.start(`Uploading "${slug}"${newVersion ? ` v${newVersion}` : ""} to R2...`)

  let archived = 0
  if (oldVersion) {
    archived = await archiveCurrentOnR2(slug, oldVersion)
  }

  const latest = await uploadFiles(slug, `presences/${slug}`)
  const uploaded = [...latest]
  const versioned = newVersion
    ? await uploadFiles(slug, `presences/${slug}/versions/${newVersion}`, true)
    : []
  uploaded.push(...versioned)

  try {
    await purgeCloudflareFiles(latest)
    if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID) {
      logger.success(`Purged ${latest.length} latest CDN file${latest.length > 1 ? "s" : ""} for "${slug}"`)
    }
  } catch (err: any) {
    s.warn(`Cloudflare purge skipped for "${slug}": ${err.message}`)
  }

  if (!newVersion) {
    s.succeed(`Uploaded ${latest.length} files to R2 for "${slug}"`)
  } else if (archived > 0) {
    s.succeed(`Uploaded ${latest.length} latest files + ${versioned.length} immutable version files (v${newVersion}) + archived ${archived} files as v${oldVersion} for "${slug}"`)
  } else {
    s.succeed(`Uploaded ${latest.length} latest files + ${versioned.length} immutable version files to R2 for "${slug}" (v${newVersion})`)
  }

  return uploaded
}

export const uploadAllToR2 = async (): Promise<void> => {
  const presencesDir = join(DIST, "presences")
  if (!existsSync(presencesDir)) {
    throw new Error(`No presences dist found at ${presencesDir}. Build first.`)
  }

  const slugs = readdirSync(presencesDir).filter((f: string) => {
    return existsSync(join(presencesDir, f, "bundle.js"))
  })

  for (const slug of slugs) {
    await uploadToR2(slug)
  }
}

type HostReleaseArtifact = {
  url: string
  sha256: string
  size: number
}

export type HostReleaseManifest = {
  version: string
  releasedAt: string
  windows: {
    installer: HostReleaseArtifact
    portable?: HostReleaseArtifact
  }
  linux?: {
    archive: HostReleaseArtifact
  }
  macos?: {
    archive?: HostReleaseArtifact
    dmg?: HostReleaseArtifact
  }
}

export const uploadHostReleaseToR2 = async (
  version: string,
  installerPath: string,
  portablePath?: string,
  linuxArchivePath?: string,
  macosArchivePath?: string,
  macosDmgPath?: string,
): Promise<HostReleaseManifest> => {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid host version: ${version}`)
  }
  if (!existsSync(installerPath)) {
    throw new Error(`Installer not found: ${installerPath}`)
  }
  if (portablePath && !existsSync(portablePath)) {
    throw new Error(`Portable archive not found: ${portablePath}`)
  }
  if (linuxArchivePath && !existsSync(linuxArchivePath)) {
    throw new Error(`Linux archive not found: ${linuxArchivePath}`)
  }
  if (macosArchivePath && !existsSync(macosArchivePath)) {
    throw new Error(`macOS archive not found: ${macosArchivePath}`)
  }
  if (macosDmgPath && !existsSync(macosDmgPath)) {
    throw new Error(`macOS DMG not found: ${macosDmgPath}`)
  }

  const installerLatestKey = "installer/nowly-setup.exe"
  const installerVersionKey = `installer/releases/${version}/nowly-setup.exe`
  const installerUrl = await putFile(installerLatestKey, installerPath, "public, max-age=300")
  await putFile(installerVersionKey, installerPath, "public, max-age=31536000, immutable")

  const manifest: HostReleaseManifest = {
    version,
    releasedAt: new Date().toISOString(),
    windows: {
      installer: {
        url: installerUrl,
        sha256: sha256File(installerPath),
        size: statSync(installerPath).size,
      },
    },
  }

  if (portablePath) {
    const portableLatestKey = "installer/nowly-windows.zip"
    const portableVersionKey = `installer/releases/${version}/nowly-windows.zip`
    const portableUrl = await putFile(portableLatestKey, portablePath, "public, max-age=300")
    await putFile(portableVersionKey, portablePath, "public, max-age=31536000, immutable")
    manifest.windows.portable = {
      url: portableUrl,
      sha256: sha256File(portablePath),
      size: statSync(portablePath).size,
    }
  }

  if (linuxArchivePath) {
    const linuxLatestKey = "installer/nowly-linux.tar.gz"
    const linuxVersionKey = `installer/releases/${version}/nowly-linux.tar.gz`
    const linuxUrl = await putFile(linuxLatestKey, linuxArchivePath, "public, max-age=300")
    await putFile(linuxVersionKey, linuxArchivePath, "public, max-age=31536000, immutable")
    manifest.linux = {
      archive: {
        url: linuxUrl,
        sha256: sha256File(linuxArchivePath),
        size: statSync(linuxArchivePath).size,
      },
    }
  }

  if (macosArchivePath) {
    const macosLatestKey = "installer/nowly-macos.tar.gz"
    const macosVersionKey = `installer/releases/${version}/nowly-macos.tar.gz`
    const macosUrl = await putFile(macosLatestKey, macosArchivePath, "public, max-age=300")
    await putFile(macosVersionKey, macosArchivePath, "public, max-age=31536000, immutable")
    manifest.macos = {
      archive: {
        url: macosUrl,
        sha256: sha256File(macosArchivePath),
        size: statSync(macosArchivePath).size,
      },
    }
  }

  if (macosDmgPath) {
    const dmgLatestKey = "installer/nowly-macos.dmg"
    const dmgVersionKey = `installer/releases/${version}/nowly-macos.dmg`
    const dmgUrl = await putFile(dmgLatestKey, macosDmgPath, "public, max-age=300")
    await putFile(dmgVersionKey, macosDmgPath, "public, max-age=31536000, immutable")
    if (!manifest.macos) manifest.macos = {}
    manifest.macos.dmg = {
      url: dmgUrl,
      sha256: sha256File(macosDmgPath),
      size: statSync(macosDmgPath).size,
    }
  }

  await putJson(`installer/releases/${version}/latest.json`, manifest, "public, max-age=31536000, immutable")
  await putJson("installer/latest.json", manifest, "public, max-age=60")

  return manifest
}
