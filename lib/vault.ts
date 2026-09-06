import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getMasterKey(): Buffer {
  const envKey = process.env.VAULT_MASTER_KEY;
  if (envKey && envKey.trim() !== '') {
    return Buffer.from(envKey, 'base64');
  }
  const fallbackSeed =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'daydraft-vault-default-secret-seed';
  return crypto.createHash('sha256').update(fallbackSeed).digest();
}

function deriveUserKey(userId: string): Buffer {
  return crypto.createHmac('sha256', getMasterKey()).update(userId).digest();
}

export function encryptApiKey(plaintext: string, userId: string): string {
  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

export function decryptApiKey(payload: string, userId: string): string {
  const key = deriveUserKey(userId);
  const data = Buffer.from(payload, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
