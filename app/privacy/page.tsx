import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f2] dark:bg-zinc-950 px-6 py-16 text-[#15211c] dark:text-zinc-100 sm:py-24 transition-colors">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#d6e0d7] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-[0_22px_60px_rgba(21,33,28,0.07)] dark:shadow-none sm:p-12 transition-colors">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            &larr; Back to Daydraft
          </Link>
          <ThemeToggle />
        </div>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          Privacy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#15211c] dark:text-zinc-100">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-[#66766d] dark:text-zinc-400">
          Last updated: September 5, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#45554d] dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              1. Who Operates Daydraft
            </h2>
            <p className="mt-2">
              Daydraft is developed and operated by Praashon from Kathmandu, Nepal. We are committed
              to safeguarding your privacy and ensuring transparency regarding how your data is
              collected, stored, and processed. Questions or privacy requests can be directed to{" "}
              <a
                className="text-emerald-700 dark:text-emerald-400 underline"
                href="mailto:praashon.dev@gmail.com"
              >
                praashon.dev@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              2. Account Information &amp; Authentication Data
            </h2>
            <p className="mt-2">
              When you register for a Daydraft account or update your profile, we collect and store:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Profile Details:</strong> Your email address, unique chosen username, and
                optional display name.
              </li>
              <li>
                <strong>Credentials &amp; Security:</strong> Cryptographically hashed passwords managed
                by Supabase Auth. Plaintext passwords are never stored or accessible by us.
              </li>
              <li>
                <strong>Multi-Factor Authentication (MFA):</strong> TOTP enrollment secrets and
                WebAuthn/Passkey public keys if you choose to activate two-step authentication in your
                profile settings.
              </li>
              <li>
                <strong>Profile Avatars:</strong> Profile photos you upload are stored in our secure
                Supabase Storage bucket (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">avatars</code>)
                with strict access controls.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              3. Password Breach Verification (k-Anonymity)
            </h2>
            <p className="mt-2">
              During account registration and password changes, we verify that your password has not
              been exposed in previous public data breaches. To ensure absolute privacy, we use
              HaveIBeenPwned&apos;s k-anonymity model:
            </p>
            <p className="mt-2">
              Your browser locally computes the SHA-1 hash of your password and transmits only the
              first 5 hexadecimal characters of that hash. Neither your actual password nor the full
              hash is ever transmitted across the network or disclosed to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              4. Workspace Content &amp; Supabase Storage Architecture
            </h2>
            <p className="mt-2">
              Daydraft persists your workspace content securely in Supabase cloud database
              infrastructure using PostgreSQL Row Level Security (RLS). When signed in:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Tasks, Notes &amp; Schedules:</strong> Your tasks, daily schedule plan items,
                focus goals, notes, and trash items are saved directly in our Supabase database tables
                (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">tasks</code>,{" "}
                <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">daily_plan_items</code>,{" "}
                <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">notes</code>,{" "}
                <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">trash</code>).
              </li>
              <li>
                <strong>User Preferences &amp; Themes:</strong> Theme choices (Light, Dark, Red, Catppuccin, One Dark),
                coaching insight history, and custom CSS reside in Supabase preference records linked to your user account.
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Strict database RLS policies (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">auth.uid() = user_id</code>) enforce
                complete data isolation, guaranteeing that your workspace data can only be accessed or modified by your authenticated account.
              </li>
              <li>
                <strong>Local Caching:</strong> For seamless performance and offline responsiveness, workspace data is cached locally in your browser&apos;s <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">localStorage</code>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              5. Cookies &amp; Session Management
            </h2>
            <p className="mt-2">
              Daydraft uses essential HTTP-only cookies generated by <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">@supabase/ssr</code> to
              maintain secure user login sessions across page navigations and verify access in Next.js
              middleware.
            </p>
            <p className="mt-2">
              We do <strong>not</strong> use advertising cookies, third-party analytics trackers, or
              behavioral tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              6. API Key Storage &amp; Encryption Vault (BYOK)
            </h2>
            <p className="mt-2">
              If you choose to supply personal API keys for third-party AI features (Google Gemini or OpenRouter):
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Server-Side Vault Encryption:</strong> API keys saved to your account are encrypted server-side using AES-256-GCM authenticated envelope encryption with per-user derived cryptographic keys.
              </li>
              <li>
                <strong>Write-Once Architecture:</strong> Encrypted keys are stored as ciphertext in our database (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">public.user_api_keys</code>). They are decrypted in-memory strictly during active AI request execution and are never returned in plaintext to the browser client or logged anywhere.
              </li>
              <li>
                <strong>Third-Party Processing:</strong> Prompts and context sent to Google Gemini or OpenRouter during AI interaction are handled in accordance with their privacy policies:
              </li>
            </ul>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 underline"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://openrouter.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 underline"
                >
                  OpenRouter Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              7. Your Choices &amp; Data Rights
            </h2>
            <p className="mt-2">You have complete control over your information:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Profile Management:</strong> You can edit your name, username, and profile
                avatar at any time via the Profile Settings page.
              </li>
              <li>
                <strong>MFA Management:</strong> You can enroll or remove TOTP factors and Passkeys
                directly from your security settings.
              </li>
              <li>
                <strong>API Key Vault Management:</strong> You can update or permanently delete your stored API keys at any time from Settings.
              </li>
              <li>
                <strong>Data Reset &amp; Deletion:</strong> You can clear your workspace data using the in-app reset controls or delete individual items across tasks, notes, schedule, and trash.
              </li>
              <li>
                <strong>Account Deletion &amp; Data Purging:</strong> If you request full account deletion, all associated database records (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">profiles</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">tasks</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">daily_plan_items</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">notes</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">trash</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">user_preferences</code>, <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">user_api_keys</code>) and uploaded storage avatars are permanently purged from Supabase. Contact us at{" "}
                <a
                  className="text-emerald-700 dark:text-emerald-400 underline"
                  href="mailto:praashon.dev@gmail.com"
                >
                  praashon.dev@gmail.com
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              8. Changes to this Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy as Daydraft evolves and introduces new features.
              The date at the top of this page indicates the most recent update. Continued use of
              Daydraft following any revisions signifies your acceptance of the updated policy.
            </p>
          </section>

          <div className="mt-12 flex flex-wrap gap-4 border-t border-[#dfe7df] dark:border-zinc-800 pt-6 text-xs text-[#89968d] dark:text-zinc-500">
            <span>Related Documents:</span>
            <Link
              href="/terms"
              className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
            >
              Terms of Service
            </Link>
            <span>&bull;</span>
            <Link
              href="/legal"
              className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
            >
              Legal Information
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
