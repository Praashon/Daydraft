import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LegalPage() {
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
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#15211c] dark:text-zinc-100">
          Legal Information &amp; Notices
        </h1>
        <p className="mt-4 text-sm text-[#66766d] dark:text-zinc-400">
          Last updated: September 5, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#45554d] dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              1. Operator and Contact
            </h2>
            <p className="mt-2">
              Daydraft is an independent software application created and operated by Praashon in
              Kathmandu, Nepal. Official inquiries, legal questions, or security disclosures can be
              directed to{" "}
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
              2. Service Description &amp; Scope
            </h2>
            <p className="mt-2">
              Daydraft is a distraction-free daily planning and cognitive organization web application
              designed to decompose unstructured mental thoughts (&quot;brain dumps&quot;) into structured
              tasks, priority rankings, chronological timelines, notes, and focused work sessions.
            </p>
            <p className="mt-2">
              Daydraft is strictly a self-management and personal productivity aid. It does not provide
              medical, psychiatric, legal, tax, financial, or any other certified professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              3. Authentication &amp; Cloud Infrastructure Architecture
            </h2>
            <p className="mt-2">
              Daydraft integrates modern cloud storage, encryption, and authentication services to protect
              user accounts and data:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase Database &amp; Authentication:</strong> User identity, verified email
                addresses, unique usernames, cryptographic password hashes, and user profile records (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">profiles</code>) are
                managed via Supabase Auth and PostgreSQL database.
              </li>
              <li>
                <strong>Row Level Security (RLS) Isolation:</strong> All workspace tables - including tasks (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">tasks</code>), daily schedule plan items (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">daily_plan_items</code>), notes (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">notes</code>), trash history (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">trash</code>), user preferences (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">user_preferences</code>), and API key vaults (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">user_api_keys</code>) - enforce strict PostgreSQL Row Level Security policies (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">auth.uid() = user_id</code>). This guarantees tenant data isolation at the database layer.
              </li>
              <li>
                <strong>API Key Vault Envelope Encryption:</strong> User-supplied API keys for Google Gemini or OpenRouter are encrypted server-side using AES-256-GCM authenticated envelope encryption with HKDF/HMAC key derivation before being stored in <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">public.user_api_keys</code>. Keys are decrypted strictly in-memory during active AI interaction and never returned in plaintext to clients.
              </li>
              <li>
                <strong>Multi-Factor Authentication (MFA):</strong> Users can enroll additional security verification
                layers, including TOTP (Time-based One-Time Password apps) and FIDO2 WebAuthn / Passkeys.
              </li>
              <li>
                <strong>Password Breach Verification:</strong> Passwords selected during registration or profile updates are checked against known compromised data breaches using HaveIBeenPwned&apos;s Pwned Passwords API. Verification relies on mathematical k-anonymity (transmitting only the first 5 hex characters of a SHA-1 hash), preventing disclosure of plain passwords or full hashes to third parties.
              </li>
              <li>
                <strong>Profile Avatar Storage:</strong> User avatars are stored in a dedicated Supabase Storage bucket (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">avatars</code>) with RLS write policies restricting file changes to the account owner.
              </li>
              <li>
                <strong>Session Security &amp; Middleware:</strong> Authenticated sessions utilize secure, HTTP-only cookies managed via <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">@supabase/ssr</code> and validated by server-side Next.js middleware.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              4. Hybrid Storage &amp; Offline Resilience
            </h2>
            <p className="mt-2">
              Daydraft employs a hybrid cloud-and-local persistence model. Workspace records stored in Supabase are synchronized with your browser&apos;s <code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">localStorage</code> for offline availability and fast local rendering.
              In-app data reset tools allow users to clear local cache or purge items from cloud database storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              5. AI Providers &amp; Third-Party Services
            </h2>
            <p className="mt-2">
              Daydraft offers cognitive organization and coaching insights using artificial intelligence.
              AI requests are processed through Google Gemini (<code className="rounded bg-[#eef3ed] dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-[#15211c] dark:text-zinc-200">@google/genai</code>)
              or OpenRouter, depending on your configuration, along with a deterministic local NLP heuristic parser:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                When an AI feature is invoked, only the submitted brain dump or coaching query is
                sent to the selected provider.
              </li>
              <li>
                Third-party AI processing is subject to the respective service terms and privacy policies
                of Google and OpenRouter.
              </li>
              <li>
                Daydraft does not guarantee continuous availability, latency guarantees, or specific
                responses from third-party AI APIs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              6. AI Output &amp; Accuracy Disclaimer
            </h2>
            <p className="mt-2">
              AI-generated suggestions, task breakdowns, deadlines, and coaching perspectives are produced
              probabilistically. They may occasionally be erroneous, incomplete, or inappropriate for
              your specific situation. You retain ultimate responsibility for reviewing and validating
              all generated tasks and schedules before relying upon them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              7. Intellectual Property
            </h2>
            <p className="mt-2">
              The Daydraft name, visual identity, logo, graphics, design system, source code, and
              interactive animations are the proprietary intellectual property of Praashon. You may not
              reproduce, duplicate, copy, sell, or exploit any portion of the Service interface or code
              without express written permission.
            </p>
            <p className="mt-2">
              Users retain full intellectual property rights and title to all personal notes, tasks,
              and content created within their Daydraft workspace.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              8. Contact Form Notice
            </h2>
            <p className="mt-2">
              The contact form on the marketing showcase currently provides a client-side confirmation
              only. It does not transmit messages to an email inbox or server database. For official,
              confidential, or urgent inquiries, please write directly to{" "}
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
              9. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="mt-2">
              Daydraft is delivered without warranties of any kind. Praashon disclaims any liability
              for direct, indirect, consequential, or incidental losses resulting from data loss,
              third-party API outages, account compromise due to weak or unmanaged credentials, or
              decisions made on the basis of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#15211c] dark:text-zinc-100">
              10. Governing Jurisdiction
            </h2>
            <p className="mt-2">
              All legal relationships, notices, and disputes connected with Daydraft are subject to
              the laws of Nepal. Venue and jurisdiction for any disputes shall lie exclusively in
              Kathmandu, Nepal.
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
              href="/privacy"
              className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
