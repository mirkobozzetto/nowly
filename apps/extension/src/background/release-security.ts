import type { PresenceRelease } from "@/shared/types";

const IS_UNPACKED = (): boolean => {
  try { return !chrome.runtime.getManifest().update_url } catch { return false }
}

const PRESENCE_SIGNING_PUBLIC_KEY = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDhuTFou1XhQRUFR6I-DTR6K2mUJkMUjgJxVMBw9EshH49oo1atlfPDHiQKj2WnuqdTS05H0D-TvVjmjz9wFvFg";

const base64UrlToBytes = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
};

const sha256Base64Url = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const signedPayload = (release: PresenceRelease): string =>
  canonicalJson({
    metadataHash: release.metadataHash,
    sha256: release.sha256,
    signedAt: release.signedAt,
    slug: release.slug,
    version: release.version,
  });

const verifySignature = async (release: PresenceRelease): Promise<boolean> => {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64UrlToBytes(PRESENCE_SIGNING_PUBLIC_KEY),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    base64UrlToBytes(release.signature),
    new TextEncoder().encode(signedPayload(release)),
  );
};

export const verifyPresenceRelease = async (
  release: PresenceRelease,
  expectedSlug?: string,
): Promise<{ ok: boolean; error?: string }> => {
  if (!release || typeof release !== "object") return { ok: false, error: "release missing" };
  if (!release.metadata || typeof release.metadata !== "object") return { ok: false, error: "release metadata missing" };
  if (typeof release.slug !== "string") return { ok: false, error: "release slug missing" };
  if (typeof release.version !== "string") return { ok: false, error: "release version missing" };
  if (typeof release.sha256 !== "string") return { ok: false, error: "release hash missing" };
  if (typeof release.metadataHash !== "string") return { ok: false, error: "release metadata hash missing" };
  if (typeof release.signature !== "string") return { ok: false, error: "release signature missing" };
  if (typeof release.signedAt !== "string") return { ok: false, error: "release signedAt missing" };
  if (expectedSlug && release.slug !== expectedSlug) return { ok: false, error: "release slug mismatch" };
  if (release.metadata.slug !== release.slug) return { ok: false, error: "metadata slug mismatch" };
  if (release.metadata.version !== release.version) return { ok: false, error: "metadata version mismatch" };
  if (!release.bundle?.trim()) return { ok: false, error: "release bundle missing" };

  const bundleHash = await sha256Base64Url(release.bundle);
  if (bundleHash !== release.sha256) return { ok: false, error: "bundle hash mismatch" };

  const metadataHash = await sha256Base64Url(canonicalJson(release.metadata));
  if (metadataHash !== release.metadataHash) return { ok: false, error: "metadata hash mismatch" };

  if (!IS_UNPACKED() || release.signature) {
    if (!await verifySignature(release)) return { ok: false, error: "release signature invalid" };
  }

  return { ok: true };
};
