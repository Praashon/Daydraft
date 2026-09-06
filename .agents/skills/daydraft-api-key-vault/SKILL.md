---
name: daydraft-api-key-vault
description: >-
  Server-side envelope encryption architecture for storing and using third-party
  API keys (Gemini, OpenRouter) in Daydraft. Use this skill when implementing,
  modifying, or debugging API key storage, retrieval, or usage in AI inference
  routes. Covers schema, encryption module (lib/vault.ts), save/delete endpoints,
  and inference-time decryption. Architecture: "Write-Once, Never-Read" — keys
  are encrypted server-side, stored as ciphertext in Supabase, decrypted
  in-memory only for outbound AI API calls, and never returned to the client.
---

# Daydraft API Key Vault — Server-Side Envelope Encryption

## Architecture Overview

```
User enters key in Settings
        │
        ▼ (HTTPS)
POST /api/settings/api-key
        │
        ▼
Server encrypts with AES-256-GCM
using per-user derived subkey (HMAC of VAULT_MASTER_KEY + userId)
        │
        ▼
Supabase stores ciphertext only (user_api_keys table)
        │
   ...later...
        │
POST /api/organize, /api/coach (inference)
        │
        ▼
Server fetches ciphertext → decrypts in-memory
        │
        ▼
Uses plaintext key for ONE fetch call to Gemini/OpenRouter
        │
        ▼
Key discarded (never logged, never cached, never returned to client)
```

## Core Principle: "Write-Once, Never-Read"

The browser sends the API key exactly once (to save it). The server never sends
the decrypted key back to any client, ever. The Settings UI only shows `key_last4`
(e.g., "ends in ab12") fetched from a metadata-only GET endpoint.

---

## 1. Schema — `user_api_keys` table

```sql
create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gemini','openrouter')),
  encrypted_key text not null,   -- base64: iv + authTag + ciphertext
  key_last4 text,                 -- for UI: "ends in ab12"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "own keys only"
  on public.user_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

> Even with RLS allowing a user to select their own row, `encrypted_key` is
> useless without the server's `VAULT_MASTER_KEY`.

## 2. Encryption Module — `lib/vault.ts` (server-only)

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = Buffer.from(process.env.VAULT_MASTER_KEY!, 'base64'); // 32 bytes

// Per-user subkey derivation — one HMAC per user off the master key.
// Compromise of one user's context doesn't leak the master.
function deriveUserKey(userId: string): Buffer {
  return crypto.createHmac('sha256', MASTER_KEY).update(userId).digest();
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
```

Generate the master key once: `openssl rand -base64 32` → store in hosting
provider's env vars (Vercel, etc.), never commit it.

## 3. Save Endpoint — `app/api/settings/api-key/route.ts`

- **POST**: Validates key with provider, encrypts, upserts into `user_api_keys`,
  returns `{ success: true, last4 }`.
- **DELETE**: Removes the key row for the given provider.
- **No GET that returns decrypted key**. A metadata GET may return
  `{ hasKey: true, last4: "ab12" }` only.

Use the Supabase **service-role admin client** (not the user-scoped client) for
DB operations to bypass RLS on the server side.

## 4. Inference-Time Usage

In `/api/organize`, `/api/coach`, and any other AI route:

1. Authenticate the user via `supabase.auth.getUser()`.
2. Fetch `encrypted_key` from `user_api_keys` using the admin client.
3. Decrypt in-memory with `decryptApiKey(row.encrypted_key, user.id)`.
4. Use the plaintext key for a single outbound fetch to Gemini/OpenRouter.
5. The key goes out of scope when the function returns — never logged, never
   persisted, never sent to the client.
6. Fallback chain: user key → `process.env.*_API_KEY` → local heuristic NLP.

## 5. Settings UI Changes

The Settings modal should:
- Send the raw key to `POST /api/settings/api-key` (over HTTPS).
- On success, display only the `last4` preview ("OpenRouter · ends in ab12 · Remove").
- Remove the key from local React state immediately after saving.
- Never store the raw key in `localStorage` or `user` context.
- The "Remove" button calls `DELETE /api/settings/api-key`.

## 6. Key Rotation Plan

To rotate `VAULT_MASTER_KEY`:
1. Decrypt all rows with old key.
2. Re-encrypt with new key.
3. Single migration script, run once.
4. Destroy old key.

## Security Trade-off

This is encryption-at-rest with server custody — not zero-knowledge. If both
server and DB are compromised simultaneously, an attacker with the codebase
could theoretically decrypt keys. For third-party API keys (not crypto wallets
or medical records), this trade-off is standard practice (Vercel, Retool, Linear).
