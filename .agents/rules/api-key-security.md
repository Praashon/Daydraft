# API Key Security — Non-Negotiable Rules

These rules apply to ALL code that touches user API keys (Gemini, OpenRouter, or
any future provider) in this codebase. No exceptions.

## Never Do

1. **Never `console.log` or `console.error` any API key**, request body
   containing a key, or headers containing a key — in any file, any route,
   any environment.
2. **Never return a decrypted API key in any API response**, for any reason,
   to any client. The only key-related data a client may receive is `key_last4`
   (last 4 characters) and a boolean `hasKey`.
3. **Never store a plaintext API key in `localStorage`**, cookies, or any
   client-side storage. Keys are encrypted server-side and stored in the
   `user_api_keys` Supabase table only.
4. **Never send a decrypted API key to the client** via WebSocket, SSE,
   server component props, or any other transport.
5. **Never commit `VAULT_MASTER_KEY`** or any encryption secret to version
   control. It must live exclusively in the hosting provider's environment
   variables.

## Always Do

1. **Authenticate the user** (`supabase.auth.getUser()`) before any operation
   involving their API key — saving, deleting, or using it for inference.
2. **Use the Supabase service-role admin client** (not the user-scoped client)
   when reading from or writing to the `user_api_keys` table on the server.
3. **Decrypt API keys in-memory only**, use them for a single outbound fetch,
   and let them go out of scope immediately.
4. **Rate-limit** the `POST /api/settings/api-key` endpoint to prevent
   brute-force abuse.
5. **Validate the key** against the provider's test endpoint before encrypting
   and storing it.
