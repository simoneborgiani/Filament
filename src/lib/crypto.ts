import {
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto'
import * as ed from '@noble/ed25519'

// NB: questo modulo è SOLO server-side (usa node:crypto + Buffer).
// Non importarlo mai in un client component.
//
// @noble/ed25519 v3: l'hashing SHA-512 è integrato, non serve più lo shim
// `ed.etc.sha512Sync` delle versioni v1/v2. Le API async usano WebCrypto.

const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEY_LENGTH = 32 // 256 bit per AES-256
const PBKDF2_DIGEST = 'sha256'
const IV_LENGTH = 12 // GCM standard
const AUTH_TAG_LENGTH = 16

export async function generateKeyPair(): Promise<{
  publicKey: string
  privateKey: string
}> {
  const privateKeyBytes = ed.utils.randomSecretKey()
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)
  return {
    privateKey: Buffer.from(privateKeyBytes).toString('base64'),
    publicKey: Buffer.from(publicKeyBytes).toString('base64'),
  }
}

export async function signData(
  data: string,
  privateKeyBase64: string
): Promise<string> {
  const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64')
  const msgBytes = new TextEncoder().encode(data)
  const signature = await ed.signAsync(msgBytes, privateKeyBytes)
  return Buffer.from(signature).toString('base64')
}

export async function verifySignature(
  data: string,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64')
  const signatureBytes = Buffer.from(signatureBase64, 'base64')
  const msgBytes = new TextEncoder().encode(data)
  return ed.verifyAsync(signatureBytes, msgBytes, publicKeyBytes)
}

function deriveKey(password: string, userId: string): Buffer {
  return pbkdf2Sync(
    password,
    userId,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST
  )
}

export function encryptPrivateKey(
  privateKeyBase64: string,
  password: string,
  userId: string
): string {
  const key = deriveKey(password, userId)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(privateKeyBase64, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // formato: iv(12) | authTag(16) | ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptPrivateKey(
  encryptedBase64: string,
  password: string,
  userId: string
): string {
  const key = deriveKey(password, userId)
  const buf = Buffer.from(encryptedBase64, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8'
  )
}
