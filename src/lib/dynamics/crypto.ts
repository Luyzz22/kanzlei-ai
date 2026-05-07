import "server-only"

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto"

/**
 * AES-256-GCM envelope encryption for Dynamics client secrets.
 *
 * Wire format:
 *   v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>
 *
 * - v1: Schema-Version-Prefix (erlaubt zukuenftige Rotation)
 * - IV:  12 Byte, zufaellig pro Aufruf (NIEMALS wiederverwenden)
 * - Tag: 16 Byte Authentication-Tag (verhindert Tampering)
 * - Ciphertext: Variable Laenge
 *
 * Master-Key kommt aus ENV DYNAMICS_ENCRYPTION_KEY:
 * - Base64-encoded 32-Byte-Key, generiert mit: `openssl rand -base64 32`
 * - Darf NICHT im Repo liegen, NICHT im Log auftauchen
 * - Bei Key-Rotation: alte verschlüsselte Secrets bleiben lesbar, solange
 *   der alte Key noch greifbar ist (v2-Prefix für neue Secrets einfuehren)
 */

const SCHEMA_VERSION = "v1"
const AES_KEY_LENGTH = 32 // 256 bit
const IV_LENGTH = 12 // GCM standard
const AUTH_TAG_LENGTH = 16

function getMasterKey(): Buffer {
  const raw = process.env.DYNAMICS_ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error(
      "DYNAMICS_ENCRYPTION_KEY is not set. " +
        "Generate one with `openssl rand -base64 32` and set it in Vercel env."
    )
  }

  let key: Buffer
  try {
    key = Buffer.from(raw, "base64")
  } catch {
    throw new Error("DYNAMICS_ENCRYPTION_KEY is not valid base64")
  }

  if (key.length !== AES_KEY_LENGTH) {
    // Fallback: wenn User einen plaintext-Key eingesetzt hat (z.B. 64 Hex-Zeichen),
    // hashen wir ihn auf 32 Byte ab. Robust gegen menschliche Fehler.
    return createHash("sha256").update(raw).digest()
  }

  return key
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) {
    throw new Error("encryptSecret: plaintext must not be empty")
  }

  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", key, iv)

  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    SCHEMA_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ct.toString("base64")
  ].join(":")
}

export function decryptSecret(envelope: string): string {
  if (!envelope) {
    throw new Error("decryptSecret: envelope must not be empty")
  }

  const parts = envelope.split(":")
  if (parts.length !== 4) {
    throw new Error("decryptSecret: invalid envelope format")
  }

  const [version, ivB64, tagB64, ctB64] = parts

  if (version !== SCHEMA_VERSION) {
    throw new Error(`decryptSecret: unsupported schema version ${version}`)
  }

  const key = getMasterKey()
  const iv = Buffer.from(ivB64!, "base64")
  const authTag = Buffer.from(tagB64!, "base64")
  const ct = Buffer.from(ctB64!, "base64")

  if (iv.length !== IV_LENGTH) throw new Error("decryptSecret: invalid IV length")
  if (authTag.length !== AUTH_TAG_LENGTH) throw new Error("decryptSecret: invalid tag length")

  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)

  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString("utf8")
}

/**
 * Generiert einen Fingerprint eines Secrets (erste 4 Zeichen SHA-256 Hex),
 * damit wir im UI anzeigen können "Secret erkannt (...abc1)" ohne den
 * Klartext jemals zurückzugeben.
 */
export function secretFingerprint(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex").slice(0, 8)
}
