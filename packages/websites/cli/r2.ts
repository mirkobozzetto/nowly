import { DIST } from "@/discover"
import { spinner } from "@/logger"
import { CopyObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join, relative } from "path"

const R2_BUCKET = process.env.R2_BUCKET ?? "nowly"
const R2_PUBLIC_URL = "https://cdn.nowly.me"

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
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
}

const getContentType = (path: string): string => {
  const ext = path.match(/\.[^.]+$/)?.[0].toLowerCase()
  return MIME_TYPES[ext ?? ""] ?? "application/octet-stream"
}

const getCacheControl = (path: string): string => {
  if (path.endsWith(".js")) return "public, max-age=31536000, immutable"
  if (path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) return "public, max-age=31536000, immutable"
  return "public, max-age=3600"
}

let s3Client: S3Client | null = null

const getClient = (): S3Client => {
  if (!s3Client) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const accountId = process.env.R2_ACCOUNT_ID

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

const uploadFiles = async (slug: string, prefix: string): Promise<string[]> => {
  const presenceDir = join(DIST, "presences", slug)
  const files = walkDir(presenceDir)
  const uploaded: string[] = []
  const client = getClient()

  for (const filePath of files) {
    const relativePath = relative(presenceDir, filePath).replace(/\\/g, "/")
    const key = join(prefix, relativePath).replace(/\\/g, "/")
    const contentType = getContentType(filePath)
    const cacheControl = getCacheControl(filePath)

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

  if (!newVersion) {
    s.succeed(`Uploaded ${latest.length} files to R2 for "${slug}"`)
  } else if (archived > 0) {
    s.succeed(`Uploaded ${latest.length} files (latest v${newVersion}) + archived ${archived} files as v${oldVersion} for "${slug}"`)
  } else {
    s.succeed(`Uploaded ${latest.length} files to R2 for "${slug}" (v${newVersion})`)
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
