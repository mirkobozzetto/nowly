import { createHash, createPrivateKey, sign } from "crypto";

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
};

export const sha256Base64Url = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("base64url");

export const signedPayload = (input: {
  slug: string;
  version: string;
  sha256: string;
  metadataHash: string;
  signedAt: string;
}): string => canonicalJson(input);

export const signPresenceRelease = (payload: string): string => {
  const privateKey = process.env.PRESENCE_SIGNING_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRESENCE_SIGNING_PRIVATE_KEY is missing");
  }

  return sign("sha256", Buffer.from(payload), {
    key: createPrivateKey({
      key: Buffer.from(privateKey, "base64url"),
      format: "der",
      type: "pkcs8",
    }),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
};
